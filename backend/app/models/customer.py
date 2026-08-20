from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    phone = Column(String, index=True, nullable=False)
    address = Column(String, nullable=True)
    type = Column(String, default="Retail", nullable=False)  # Retail, Contractor, Credit
    credit_balance = Column(Float, default=0.0, nullable=False)  # Udhaar amount owed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    sales = relationship("Sale", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")
