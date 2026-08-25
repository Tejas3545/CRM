from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.db.session import get_db
from app.core.deps import get_current_user
from app.core.cache import cache
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from app.models.payment import Payment
from app.schemas.report import (
    DashboardSummary, TopSellingProduct, DeadStockItem,
    OutstandingCreditItem, LowStockItem, ProfitMarginSummary
)

router = APIRouter(prefix="/reports", tags=["Reports & Business Analytics"])

def to_naive(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt.replace(tzinfo=None) if hasattr(dt, "tzinfo") and dt.tzinfo else dt

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cache_key = "reports:dashboard"
    cached = cache.get(cache_key)
    if cached:
        return cached

    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    first_of_month = datetime(now.year, now.month, 1)

    # Sales Today
    today_sales = db.query(Sale).filter(Sale.date >= today_start).all()
    today_total = sum(s.total for s in today_sales)
    today_count = len(today_sales)

    # Sales Month to date
    month_sales = db.query(Sale).filter(Sale.date >= first_of_month).all()
    month_total = sum(s.total for s in month_sales)

    # Total Outstanding Credit (Udhaar)
    total_udhaar = db.query(func.sum(Customer.credit_balance)).scalar() or 0.0

    # Low Stock Items count
    low_stock_cnt = db.query(Product).filter(Product.stock_qty <= Product.low_stock_threshold).count()

    total_prods = db.query(Product).count()
    total_custs = db.query(Customer).count()

    result = DashboardSummary(
        today_sales_total=round(today_total, 2),
        today_sales_count=today_count,
        monthly_sales_total=round(month_total, 2),
        total_outstanding_credit=round(total_udhaar, 2),
        low_stock_count=low_stock_cnt,
        total_products_count=total_prods,
        total_customers_count=total_custs
    )

    cache.set(cache_key, result, ttl=15)
    return result

@router.get("/top-selling", response_model=List[TopSellingProduct])
def get_top_selling_products(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cache_key = f"reports:top-selling:{limit}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    results = (
        db.query(
            Product.id,
            Product.sku,
            Product.name,
            Product.category,
            func.sum(SaleItem.qty).label("total_qty"),
            func.sum(SaleItem.total).label("total_revenue")
        )
        .join(SaleItem, Product.id == SaleItem.product_id)
        .group_by(Product.id, Product.sku, Product.name, Product.category)
        .order_by(desc("total_qty"))
        .limit(limit)
        .all()
    )

    out = []
    for r in results:
        out.append(
            TopSellingProduct(
                product_id=r.id,
                product_sku=r.sku,
                product_name=r.name,
                category=r.category,
                total_qty_sold=round(float(r.total_qty or 0), 2),
                total_revenue=round(float(r.total_revenue or 0), 2)
            )
        )

    cache.set(cache_key, out, ttl=30)
    return out

@router.get("/dead-stock", response_model=List[DeadStockItem])
def get_dead_stock_report(
    days: int = Query(default=30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cache_key = f"reports:dead-stock:{days}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    cutoff_date = datetime.now() - timedelta(days=days)

    active_product_ids = (
        db.query(SaleItem.product_id)
        .join(Sale, SaleItem.sale_id == Sale.id)
        .filter(Sale.date >= cutoff_date)
        .distinct()
        .all()
    )
    active_ids = {row[0] for row in active_product_ids}

    query = db.query(Product).filter(Product.stock_qty > 0)
    if active_ids:
        query = query.filter(~Product.id.in_(active_ids))

    dead_products = query.all()

    out = []
    now = datetime.now()
    for p in dead_products:
        last_sale = (
            db.query(Sale.date)
            .join(SaleItem, Sale.id == SaleItem.sale_id)
            .filter(SaleItem.product_id == p.id)
            .order_by(desc(Sale.date))
            .first()
        )
        days_since = None
        if last_sale and last_sale[0]:
            last_date = to_naive(last_sale[0])
            days_since = max(0, (now - last_date).days)

        out.append(
            DeadStockItem(
                product_id=p.id,
                product_sku=p.sku,
                product_name=p.name,
                category=p.category,
                stock_qty=p.stock_qty,
                unit=p.unit,
                purchase_price=p.purchase_price,
                holding_value=round(p.stock_qty * p.purchase_price, 2),
                days_since_last_sale=days_since
            )
        )

    cache.set(cache_key, out, ttl=60)
    return out

@router.get("/outstanding-credit", response_model=List[OutstandingCreditItem])
def get_outstanding_credit_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cache_key = "reports:outstanding-credit"
    cached = cache.get(cache_key)
    if cached:
        return cached

    credit_customers = (
        db.query(Customer)
        .filter(Customer.credit_balance > 0)
        .order_by(desc(Customer.credit_balance))
        .all()
    )

    out = []
    now = datetime.now()
    for c in credit_customers:
        last_payment = (
            db.query(Payment)
            .filter(Payment.customer_id == c.id)
            .order_by(desc(Payment.date))
            .first()
        )

        last_invoice = (
            db.query(Sale)
            .filter(Sale.customer_id == c.id, Sale.payment_status != "Paid")
            .order_by(Sale.date.asc())
            .first()
        )

        days_overdue = 0
        if last_invoice and last_invoice.date:
            inv_date = to_naive(last_invoice.date)
            days_overdue = max(0, (now - inv_date).days)

        out.append(
            OutstandingCreditItem(
                customer_id=c.id,
                customer_name=c.name,
                customer_phone=c.phone,
                customer_type=c.type,
                credit_balance=c.credit_balance,
                last_payment_date=to_naive(last_payment.date) if last_payment else None,
                days_overdue=days_overdue
            )
        )

    cache.set(cache_key, out, ttl=15)
    return out

@router.get("/low-stock", response_model=List[LowStockItem])
def get_low_stock_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cache_key = "reports:low-stock"
    cached = cache.get(cache_key)
    if cached:
        return cached

    low_stock_prods = (
        db.query(Product)
        .filter(Product.stock_qty <= Product.low_stock_threshold)
        .order_by(Product.stock_qty.asc())
        .all()
    )

    out = []
    for p in low_stock_prods:
        out.append(
            LowStockItem(
                product_id=p.id,
                product_sku=p.sku,
                product_name=p.name,
                category=p.category,
                stock_qty=p.stock_qty,
                low_stock_threshold=p.low_stock_threshold,
                unit=p.unit,
                supplier_name=p.supplier.name if p.supplier else None
            )
        )

    cache.set(cache_key, out, ttl=15)
    return out

@router.get("/profit-margin", response_model=ProfitMarginSummary)
def get_profit_margin_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cache_key = "reports:profit-margin"
    cached = cache.get(cache_key)
    if cached:
        return cached

    sale_items = db.query(SaleItem).all()

    total_revenue = 0.0
    total_cost = 0.0

    for item in sale_items:
        total_revenue += item.total
        if item.product:
            total_cost += item.qty * item.product.purchase_price

    gross_profit = total_revenue - total_cost
    margin_pct = (gross_profit / total_revenue * 100.0) if total_revenue > 0 else 0.0

    result = ProfitMarginSummary(
        total_revenue=round(total_revenue, 2),
        total_cost_of_goods=round(total_cost, 2),
        gross_profit=round(gross_profit, 2),
        profit_margin_percentage=round(margin_pct, 2)
    )

    cache.set(cache_key, result, ttl=30)
    return result

@router.get("/sales")
def get_sales_report(
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    payment_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Sale)
    if payment_type and payment_type != "All":
        query = query.filter(Sale.payment_type == payment_type)
    
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Sale.date >= sd)
        except Exception:
            pass

    if end_date:
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Sale.date < ed)
        except Exception:
            pass

    sales = query.order_by(desc(Sale.date)).all()

    total_sales = sum(s.total for s in sales)
    total_discount = sum(s.discount for s in sales)

    inv_list = []
    for s in sales:
        inv_list.append({
            "id": s.id,
            "invoice_no": s.invoice_no,
            "customer_name": s.customer.name if s.customer else "Walk-in Retail",
            "payment_type": s.payment_type,
            "total": s.total,
            "created_at": s.date.isoformat() if s.date else datetime.now().isoformat()
        })

    return {
        "total_sales": round(total_sales, 2),
        "total_invoices": len(sales),
        "total_discount": round(total_discount, 2),
        "invoices": inv_list
    }

