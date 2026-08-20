from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TopSellingProduct(BaseModel):
    product_id: int
    product_sku: str
    product_name: str
    category: str
    total_qty_sold: float
    total_revenue: float

class DeadStockItem(BaseModel):
    product_id: int
    product_sku: str
    product_name: str
    category: str
    stock_qty: float
    unit: str
    purchase_price: float
    holding_value: float
    days_since_last_sale: Optional[int] = None

class OutstandingCreditItem(BaseModel):
    customer_id: int
    customer_name: str
    customer_phone: str
    customer_type: str
    credit_balance: float
    last_payment_date: Optional[datetime] = None
    days_overdue: int = 0

class LowStockItem(BaseModel):
    product_id: int
    product_sku: str
    product_name: str
    category: str
    stock_qty: float
    low_stock_threshold: float
    unit: str
    supplier_name: Optional[str] = None

class DashboardSummary(BaseModel):
    today_sales_total: float
    today_sales_count: int
    monthly_sales_total: float
    total_outstanding_credit: float
    low_stock_count: int
    total_products_count: int
    total_customers_count: int

class ProfitMarginSummary(BaseModel):
    total_revenue: float
    total_cost_of_goods: float
    gross_profit: float
    profit_margin_percentage: float
