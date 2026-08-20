from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta, timezone

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.payment import Payment
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut, CustomerLedgerSummary

router = APIRouter(prefix="/customers", tags=["CRM & Customer Ledger"])

@router.get("", response_model=List[CustomerOut])
def list_customers(
    customer_type: Optional[str] = None,
    search: Optional[str] = None,
    has_udhaar_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Customer)

    if customer_type:
        query = query.filter(Customer.type == customer_type)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Customer.name.ilike(pattern),
                Customer.phone.ilike(pattern),
                Customer.address.ilike(pattern)
            )
        )

    if has_udhaar_only:
        query = query.filter(Customer.credit_balance > 0)

    customers = query.order_by(Customer.name.asc()).all()
    return customers

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Customer).filter(Customer.phone == customer_in.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Customer with phone number '{customer_in.phone}' already exists")

    customer = Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = customer_in.model_dump(exclude_unset=True)

    if "phone" in update_data and update_data["phone"] != customer.phone:
        existing = db.query(Customer).filter(Customer.phone == update_data["phone"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered to another customer")

    for field, val in update_data.items():
        setattr(customer, field, val)

    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()

@router.get("/{customer_id}/ledger", response_model=CustomerLedgerSummary)
def get_customer_ledger_summary(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    sales = db.query(Sale).filter(Sale.customer_id == customer_id).all()
    payments = db.query(Payment).filter(Payment.customer_id == customer_id).all()

    total_billed = sum(s.total for s in sales)
    total_paid_at_sale = sum(s.amount_paid for s in sales if s.payment_type != "Credit")
    total_payments_repaid = sum(p.amount for p in payments)
    
    total_paid = total_paid_at_sale + total_payments_repaid

    # Overdue flag calculation: check if customer owes money and has unpaid credit invoices older than 30 days
    has_overdue = False
    if customer.credit_balance > 0:
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        old_unpaid_sales = db.query(Sale).filter(
            Sale.customer_id == customer_id,
            Sale.payment_status != "Paid",
            Sale.date <= thirty_days_ago
        ).count()
        if old_unpaid_sales > 0:
            has_overdue = True

    return CustomerLedgerSummary(
        customer=CustomerOut.model_validate(customer),
        total_sales_count=len(sales),
        total_billed_amount=round(total_billed, 2),
        total_paid_amount=round(total_paid, 2),
        current_credit_balance=round(customer.credit_balance, 2),
        has_overdue_flag=has_overdue
    )
