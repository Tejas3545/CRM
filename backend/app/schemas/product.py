from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ProductCreate(BaseModel):
    sku: str
    barcode: Optional[str] = None
    name: str
    category: str  # Pipes, Fittings, Valves, Taps, Cement/Adhesives, Sanitary Ware, Tools, Electricals, Misc
    brand: Optional[str] = None
    unit: str  # piece, meter, foot, kg, bag, box
    purchase_price: float = Field(ge=0.0)
    selling_price: float = Field(ge=0.0)
    gst_rate: float = Field(default=18.0)  # 5, 12, 18, 28
    hsn_code: Optional[str] = "3917"
    stock_qty: float = Field(default=0.0, ge=0.0)
    low_stock_threshold: float = Field(default=10.0, ge=0.0)
    supplier_id: Optional[int] = None

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    gst_rate: Optional[float] = None
    hsn_code: Optional[str] = None
    stock_qty: Optional[float] = None
    low_stock_threshold: Optional[float] = None
    supplier_id: Optional[int] = None

class ProductOut(BaseModel):
    id: int
    sku: str
    barcode: Optional[str] = None
    name: str
    category: str
    brand: Optional[str] = None
    unit: str
    purchase_price: float
    selling_price: float
    gst_rate: float
    hsn_code: Optional[str] = None
    stock_qty: float
    low_stock_threshold: float
    supplier_id: Optional[int] = None
    is_low_stock: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BulkConversionRequest(BaseModel):
    product_id: int
    bulk_unit_name: str  # e.g., "Bundle (100 meters)"
    quantity_converted: float  # e.g., 1 bundle
    units_per_bulk: float  # e.g., 100 meters per bundle
