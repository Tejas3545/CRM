from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    linked_invoice_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    amount = Column(Float, nullable=False)
    mode = Column(String, nullable=False, default="Cash")  # Cash, UPI, Bank Transfer, Cheque
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    reference_no = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="payments")
    linked_invoice = relationship("Sale", back_populates="payments")
