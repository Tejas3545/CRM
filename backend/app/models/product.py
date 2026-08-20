from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    barcode = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)  # Pipes, Fittings, Valves, Taps, Cement/Adhesives, Sanitary Ware, Tools, Electricals, Misc
    brand = Column(String, nullable=True)
    unit = Column(String, nullable=False)  # piece, meter, foot, kg, bag, box
    purchase_price = Column(Float, nullable=False, default=0.0)
    selling_price = Column(Float, nullable=False, default=0.0)
    gst_rate = Column(Float, nullable=False, default=18.0)  # 5, 12, 18, 28
    hsn_code = Column(String, nullable=True, default="3917")  # Default HSN for plumbing plastics/pipes
    stock_qty = Column(Float, nullable=False, default=0.0)
    low_stock_threshold = Column(Float, nullable=False, default=10.0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    supplier = relationship("Supplier", back_populates="products")
    purchase_items = relationship("PurchaseItem", back_populates="product")
    sale_items = relationship("SaleItem", back_populates="product")
    stock_adjustments = relationship("StockAdjustment", back_populates="product")
