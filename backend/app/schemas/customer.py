from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CustomerCreate(BaseModel):
    name: str
    phone: str
    address: Optional[str] = None
    type: str = "Retail"  # Retail, Contractor, Credit
    notes: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None

class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    address: Optional[str] = None
    type: str
    credit_balance: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomerLedgerSummary(BaseModel):
    customer: CustomerOut
    total_sales_count: int
    total_billed_amount: float
    total_paid_amount: float
    current_credit_balance: float
    has_overdue_flag: bool
