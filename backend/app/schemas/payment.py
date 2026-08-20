from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PaymentCreate(BaseModel):
    customer_id: int
    amount: float = Field(gt=0.0)
    mode: str = "Cash"  # Cash, UPI, Bank Transfer, Cheque
    linked_invoice_id: Optional[int] = None
    reference_no: Optional[str] = None
    notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    linked_invoice_id: Optional[int] = None
    linked_invoice_no: Optional[str] = None
    amount: float
    mode: str
    date: datetime
    reference_no: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
