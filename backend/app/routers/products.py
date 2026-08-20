from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.stock_adjustment import StockAdjustment
from app.models.supplier import Supplier
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductOut, BulkConversionRequest
)
from app.schemas.stock_adjustment import StockAdjustmentCreate, StockAdjustmentOut

router = APIRouter(prefix="/products", tags=["Inventory & Products"])

@router.get("", response_model=List[ProductOut])
def list_products(
    category: Optional[str] = None,
    low_stock_only: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    
    if category:
        query = query.filter(Product.category == category)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.sku.ilike(search_pattern),
                Product.barcode.ilike(search_pattern),
                Product.brand.ilike(search_pattern)
            )
        )
    
    products = query.order_by(Product.name.asc()).all()

    result = []
    for p in products:
        p_dict = ProductOut.model_validate(p)
        p_dict.is_low_stock = (p.stock_qty <= p.low_stock_threshold)
        if low_stock_only and not p_dict.is_low_stock:
            continue
        result.append(p_dict)
        
    return result

@router.get("/lookup/{code}", response_model=ProductOut)
def lookup_product_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(
        or_(Product.sku == code, Product.barcode == code)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found with specified SKU/Barcode")
    
    res = ProductOut.model_validate(product)
    res.is_low_stock = (product.stock_qty <= product.low_stock_threshold)
    return res

@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    res = ProductOut.model_validate(product)
    res.is_low_stock = (product.stock_qty <= product.low_stock_threshold)
    return res

@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_sku = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing_sku:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{product_in.sku}' already exists")
    
    if product_in.barcode:
        existing_bc = db.query(Product).filter(Product.barcode == product_in.barcode).first()
        if existing_bc:
            raise HTTPException(status_code=400, detail=f"Product with Barcode '{product_in.barcode}' already exists")

    if product_in.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == product_in.supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=400, detail="Specified Supplier does not exist")

    db_product = Product(**product_in.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # Log initial stock as adjustment if > 0
    if db_product.stock_qty > 0:
        adj = StockAdjustment(
            product_id=db_product.id,
            qty_change=db_product.stock_qty,
            reason="Initial Stock Setup",
            created_by_user_id=current_user.id
        )
        db.add(adj)
        db.commit()

    res = ProductOut.model_validate(db_product)
    res.is_low_stock = (db_product.stock_qty <= db_product.low_stock_threshold)
    return res

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_in.model_dump(exclude_unset=True)
    
    if "sku" in update_data and update_data["sku"] != product.sku:
        exists = db.query(Product).filter(Product.sku == update_data["sku"]).first()
        if exists:
            raise HTTPException(status_code=400, detail="SKU already in use by another product")

    if "barcode" in update_data and update_data["barcode"] and update_data["barcode"] != product.barcode:
        exists = db.query(Product).filter(Product.barcode == update_data["barcode"]).first()
        if exists:
            raise HTTPException(status_code=400, detail="Barcode already in use by another product")

    for field, val in update_data.items():
        setattr(product, field, val)

    db.commit()
    db.refresh(product)

    res = ProductOut.model_validate(product)
    res.is_low_stock = (product.stock_qty <= product.low_stock_threshold)
    return res

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()

@router.post("/adjust-stock", response_model=StockAdjustmentOut)
def adjust_stock(
    adj_in: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == adj_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_qty = product.stock_qty + adj_in.qty_change
    if new_qty < 0:
        raise HTTPException(status_code=400, detail=f"Cannot reduce stock below 0. Current stock: {product.stock_qty}")

    product.stock_qty = new_qty
    
    adjustment = StockAdjustment(
        product_id=adj_in.product_id,
        qty_change=adj_in.qty_change,
        reason=adj_in.reason,
        created_by_user_id=current_user.id
    )
    db.add(adjustment)
    db.commit()
    db.refresh(adjustment)

    res = StockAdjustmentOut.model_validate(adjustment)
    res.product_name = product.name
    res.product_sku = product.sku
    res.created_by_username = current_user.username
    return res

@router.post("/bulk-convert", response_model=StockAdjustmentOut)
def convert_bulk_purchase_to_units(
    req: BulkConversionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    added_units = req.quantity_converted * req.units_per_bulk
    product.stock_qty += added_units

    reason = f"Bulk Conversion: {req.quantity_converted} {req.bulk_unit_name} converted to {added_units} {product.unit}s"
    
    adjustment = StockAdjustment(
        product_id=req.product_id,
        qty_change=added_units,
        reason=reason,
        created_by_user_id=current_user.id
    )
    db.add(adjustment)
    db.commit()
    db.refresh(adjustment)

    res = StockAdjustmentOut.model_validate(adjustment)
    res.product_name = product.name
    res.product_sku = product.sku
    res.created_by_username = current_user.username
    return res

@router.get("/adjustments/log", response_model=List[StockAdjustmentOut])
def get_adjustment_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    adjustments = db.query(StockAdjustment).order_by(StockAdjustment.created_at.desc()).all()
    results = []
    for adj in adjustments:
        out = StockAdjustmentOut.model_validate(adj)
        if adj.product:
            out.product_name = adj.product.name
            out.product_sku = adj.product.sku
        if adj.user:
            out.created_by_username = adj.user.username
        results.append(out)
    return results
