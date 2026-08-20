from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.schemas.customer import CustomerOut

class SaleItemCreate(BaseModel):
    product_id: int
    qty: float = Field(gt=0.0)
    unit_price: float = Field(ge=0.0)
    discount: float = Field(default=0.0, ge=0.0)

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None  # None for Walk-in Retail
    payment_type: str = "Cash"  # Cash, Credit, UPI, Card
    amount_paid: float = Field(default=0.0, ge=0.0)
    discount: float = Field(default=0.0, ge=0.0)
    items: List[SaleItemCreate]

class SaleItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    unit: Optional[str] = None
    hsn_code: Optional[str] = None
    qty: float
    unit_price: float
    gst_rate: float
    gst_amount: float
    discount: float
    total: float

    class Config:
        from_attributes = True

class SaleOut(BaseModel):
    id: int
    invoice_no: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    date: datetime
    subtotal: float
    gst_amount: float
    discount: float
    total: float
    payment_type: str
    amount_paid: float
    payment_status: str
    items: List[SaleItemOut]
    created_at: datetime

    class Config:
        from_attributes = True
