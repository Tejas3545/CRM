from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.purchase import Purchase, PurchaseItem
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.stock_adjustment import StockAdjustment
from app.schemas.purchase import PurchaseCreate, PurchaseOut, PurchaseItemOut

router = APIRouter(prefix="/purchases", tags=["Purchases & Stock-In"])

@router.get("", response_model=List[PurchaseOut])
def list_purchases(
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Purchase)
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)

    purchases = query.order_by(Purchase.date.desc()).all()
    results = []

    for pur in purchases:
        out = PurchaseOut.model_validate(pur)
        if pur.supplier:
            out.supplier_name = pur.supplier.name
        
        items_out = []
        for item in pur.items:
            item_out = PurchaseItemOut.model_validate(item)
            if item.product:
                item_out.product_name = item.product.name
                item_out.product_sku = item.product.sku
            items_out.append(item_out)
        out.items = items_out
        results.append(out)

    return results

@router.post("", response_model=PurchaseOut, status_code=status.HTTP_201_CREATED)
def create_purchase(
    purchase_in: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = db.query(Supplier).filter(Supplier.id == purchase_in.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found")

    if not purchase_in.items:
        raise HTTPException(status_code=400, detail="Purchase must contain at least one item")

    total_amount = 0.0
    purchase_items = []

    # Create Purchase Master
    purchase = Purchase(
        supplier_id=purchase_in.supplier_id,
        invoice_number=purchase_in.invoice_number,
        date=datetime.now(timezone.utc),
        notes=purchase_in.notes
    )
    db.add(purchase)
    db.flush()  # assign ID

    for item_in in purchase_in.items:
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID #{item_in.product_id} not found")

        item_total = item_in.qty * item_in.cost_price
        total_amount += item_total

        purchase_item = PurchaseItem(
            purchase_id=purchase.id,
            product_id=product.id,
            qty=item_in.qty,
            cost_price=item_in.cost_price,
            total=round(item_total, 2)
        )
        db.add(purchase_item)
        purchase_items.append(purchase_item)

        # Update product stock & cost price
        product.stock_qty += item_in.qty
        product.purchase_price = item_in.cost_price

        # Record stock adjustment log
        adj = StockAdjustment(
            product_id=product.id,
            qty_change=item_in.qty,
            reason=f"Purchase Stock-In (Ref #{purchase_in.invoice_number or purchase.id})",
            created_by_user_id=current_user.id
        )
        db.add(adj)

    purchase.total_amount = round(total_amount, 2)
    db.commit()
    db.refresh(purchase)

    out = PurchaseOut.model_validate(purchase)
    out.supplier_name = supplier.name
    items_out = []
    for pi in purchase.items:
        pi_out = PurchaseItemOut.model_validate(pi)
        if pi.product:
            pi_out.product_name = pi.product.name
            pi_out.product_sku = pi.product.sku
        items_out.append(pi_out)
    out.items = items_out
    return out
