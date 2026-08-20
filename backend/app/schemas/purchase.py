from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.schemas.supplier import SupplierOut
from app.schemas.product import ProductOut

class PurchaseItemCreate(BaseModel):
    product_id: int
    qty: float = Field(gt=0.0)
    cost_price: float = Field(ge=0.0)

class PurchaseCreate(BaseModel):
    supplier_id: int
    invoice_number: Optional[str] = None
    items: List[PurchaseItemCreate]
    notes: Optional[str] = None

class PurchaseItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    qty: float
    cost_price: float
    total: float

    class Config:
        from_attributes = True

class PurchaseOut(BaseModel):
    id: int
    supplier_id: int
    supplier_name: Optional[str] = None
    invoice_number: Optional[str] = None
    date: datetime
    total_amount: float
    notes: Optional[str] = None
    items: List[PurchaseItemOut]
    created_at: datetime

    class Config:
        from_attributes = True
