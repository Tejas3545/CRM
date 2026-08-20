from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.sale import Sale, SaleItem
from app.models.customer import Customer
from app.models.product import Product
from app.models.payment import Payment
from app.models.stock_adjustment import StockAdjustment
from app.schemas.sale import SaleCreate, SaleOut, SaleItemOut
from app.services.pdf_service import generate_gst_invoice_pdf

router = APIRouter(prefix="/sales", tags=["POS Billing & Sales"])

def generate_invoice_number(db: Session) -> str:
    today_str = datetime.now().strftime("%Y%m%d")
    count_today = db.query(Sale).filter(Sale.invoice_no.like(f"INV-{today_str}-%")).count()
    return f"INV-{today_str}-{count_today + 1:04d}"

@router.get("", response_model=List[SaleOut])
def list_sales(
    customer_id: Optional[int] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Sale)
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    if payment_status:
        query = query.filter(Sale.payment_status == payment_status)

    sales = query.order_by(Sale.date.desc()).all()
    results = []

    for s in sales:
        out = SaleOut.model_validate(s)
        if s.customer:
            out.customer_name = s.customer.name
            out.customer_phone = s.customer.phone
        
        items_out = []
        for item in s.items:
            item_out = SaleItemOut.model_validate(item)
            if item.product:
                item_out.product_name = item.product.name
                item_out.product_sku = item.product.sku
                item_out.unit = item.product.unit
                item_out.hsn_code = item.product.hsn_code
            items_out.append(item_out)
        out.items = items_out
        results.append(out)

    return results

@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Invoice not found")

    out = SaleOut.model_validate(sale)
    if sale.customer:
        out.customer_name = sale.customer.name
        out.customer_phone = sale.customer.phone

    items_out = []
    for item in sale.items:
        item_out = SaleItemOut.model_validate(item)
        if item.product:
            item_out.product_name = item.product.name
            item_out.product_sku = item.product.sku
            item_out.unit = item.product.unit
            item_out.hsn_code = item.product.hsn_code
        items_out.append(item_out)
    out.items = items_out
    return out

@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
def create_sale_invoice(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Invoice must contain at least one item")

    customer = None
    if sale_in.customer_id:
        customer = db.query(Customer).filter(Customer.id == sale_in.customer_id).first()
        if not customer:
            raise HTTPException(status_code=400, detail="Selected Customer not found")
    elif sale_in.payment_type == "Credit":
        raise HTTPException(status_code=400, detail="Credit (udhaar) sales require selecting a registered customer profile")

    # Validate stock & compute totals
    subtotal = 0.0
    total_gst = 0.0
    sale_items_to_add = []

    invoice_no = generate_invoice_number(db)

    # First pass: check stock availability for all items
    for item_in in sale_in.items:
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID #{item_in.product_id} not found")

        if product.stock_qty < item_in.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_qty} {product.unit}, Requested: {item_in.qty} {product.unit}"
            )

    # Second pass: compute line items & deduct stock
    for item_in in sale_in.items:
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        
        # Line item subtotal before tax
        line_base = (item_in.qty * item_in.unit_price) - item_in.discount
        if line_base < 0:
            line_base = 0.0

        # GST amount for this line
        gst_rate = product.gst_rate
        line_gst = line_base * (gst_rate / 100.0)
        line_total = line_base + line_gst

        subtotal += line_base
        total_gst += line_gst

        sale_item = SaleItem(
            product_id=product.id,
            qty=item_in.qty,
            unit_price=item_in.unit_price,
            gst_rate=gst_rate,
            gst_amount=round(line_gst, 2),
            discount=item_in.discount,
            total=round(line_total, 2)
        )
        sale_items_to_add.append((sale_item, product))

    grand_total = round(subtotal + total_gst - sale_in.discount, 2)
    if grand_total < 0:
        grand_total = 0.0

    # Determine payment status
    amount_paid = sale_in.amount_paid
    if sale_in.payment_type != "Credit" and amount_paid == 0.0:
        amount_paid = grand_total  # Full payment assumed for Cash/UPI/Card if unspecified

    if amount_paid >= grand_total:
        payment_status = "Paid"
        amount_paid = grand_total
    elif amount_paid > 0:
        payment_status = "Partial"
    else:
        payment_status = "Unpaid"

    # Create Sale Record
    sale = Sale(
        invoice_no=invoice_no,
        customer_id=sale_in.customer_id,
        date=datetime.now(timezone.utc),
        subtotal=round(subtotal, 2),
        gst_amount=round(total_gst, 2),
        discount=sale_in.discount,
        total=grand_total,
        payment_type=sale_in.payment_type,
        amount_paid=round(amount_paid, 2),
        payment_status=payment_status
    )
    db.add(sale)
    db.flush()

    # Link items and update product stocks
    for sale_item, product in sale_items_to_add:
        sale_item.sale_id = sale.id
        db.add(sale_item)

        # Auto stock decrement
        product.stock_qty -= sale_item.qty

        # Log stock adjustment
        adj = StockAdjustment(
            product_id=product.id,
            qty_change=-sale_item.qty,
            reason=f"POS Sale (Invoice #{invoice_no})",
            created_by_user_id=current_user.id
        )
        db.add(adj)

    # Handle Credit (Udhaar) ledger update for customer
    balance_due = round(grand_total - amount_paid, 2)
    if customer and balance_due > 0:
        customer.credit_balance = round(customer.credit_balance + balance_due, 2)

    # If any payment was made at sale time, log payment record
    if amount_paid > 0 and customer:
        payment_record = Payment(
            customer_id=customer.id,
            linked_invoice_id=sale.id,
            amount=amount_paid,
            mode=sale_in.payment_type if sale_in.payment_type != "Credit" else "Cash",
            date=datetime.now(timezone.utc),
            reference_no=f"POS Initial Payment ({invoice_no})",
            notes="Payment recorded during invoice creation"
        )
        db.add(payment_record)

    db.commit()
    db.refresh(sale)

    out = SaleOut.model_validate(sale)
    if customer:
        out.customer_name = customer.name
        out.customer_phone = customer.phone

    items_out = []
    for item in sale.items:
        item_out = SaleItemOut.model_validate(item)
        if item.product:
            item_out.product_name = item.product.name
            item_out.product_sku = item.product.sku
            item_out.unit = item.product.unit
            item_out.hsn_code = item.product.hsn_code
        items_out.append(item_out)
    out.items = items_out

    return out

@router.get("/{sale_id}/pdf")
def download_invoice_pdf(
    sale_id: int,
    db: Session = Depends(get_db)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Invoice not found")

    customer = sale.customer
    items = sale.items

    pdf_bytes = generate_gst_invoice_pdf(sale, customer, items)

    filename = f"Invoice_{sale.invoice_no}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )
