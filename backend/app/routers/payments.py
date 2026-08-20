from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.models.customer import Customer
from app.models.sale import Sale
from app.schemas.payment import PaymentCreate, PaymentOut

router = APIRouter(prefix="/payments", tags=["CRM & Credit Payments"])

@router.get("", response_model=List[PaymentOut])
def list_payments(
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Payment)
    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)

    payments = query.order_by(Payment.date.desc()).all()
    results = []

    for p in payments:
        out = PaymentOut.model_validate(p)
        if p.customer:
            out.customer_name = p.customer.name
        if p.linked_invoice:
            out.linked_invoice_no = p.linked_invoice.invoice_no
        results.append(out)

    return results

@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def record_customer_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == payment_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if payment_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

    # Record Payment
    payment = Payment(
        customer_id=payment_in.customer_id,
        linked_invoice_id=payment_in.linked_invoice_id,
        amount=round(payment_in.amount, 2),
        mode=payment_in.mode,
        date=datetime.now(timezone.utc),
        reference_no=payment_in.reference_no,
        notes=payment_in.notes
    )
    db.add(payment)

    # Deduct customer credit balance (udhaar)
    new_balance = customer.credit_balance - payment_in.amount
    if new_balance < 0:
        new_balance = 0.0  # prevent negative udhaar balance
    customer.credit_balance = round(new_balance, 2)

    # If linked to specific invoice, update invoice payment status
    if payment_in.linked_invoice_id:
        sale = db.query(Sale).filter(Sale.id == payment_in.linked_invoice_id).first()
        if sale:
            sale.amount_paid = round(sale.amount_paid + payment_in.amount, 2)
            if sale.amount_paid >= sale.total:
                sale.payment_status = "Paid"
            else:
                sale.payment_status = "Partial"

    db.commit()
    db.refresh(payment)
    from app.core.cache import cache
    cache.invalidate("reports")

    out = PaymentOut.model_validate(payment)
    out.customer_name = customer.name
    if payment.linked_invoice:
        out.linked_invoice_no = payment.linked_invoice.invoice_no
    return out
