from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class StockAdjustmentCreate(BaseModel):
    product_id: int
    qty_change: float  # can be positive or negative
    reason: str  # Damage, Return, Correction, Expiry, Bulk Conversion

class StockAdjustmentOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    qty_change: float
    reason: str
    date: datetime
    created_by_user_id: Optional[int] = None
    created_by_username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
