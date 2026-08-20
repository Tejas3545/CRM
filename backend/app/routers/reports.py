from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta, timezone

from app.db.session import get_db
from app.core.deps import get_current_user
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

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    first_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

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

    return DashboardSummary(
        today_sales_total=round(today_total, 2),
        today_sales_count=today_count,
        monthly_sales_total=round(month_total, 2),
        total_outstanding_credit=round(total_udhaar, 2),
        low_stock_count=low_stock_cnt,
        total_products_count=total_prods,
        total_customers_count=total_custs
    )

@router.get("/top-selling", response_model=List[TopSellingProduct])
def get_top_selling_products(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    return out

@router.get("/dead-stock", response_model=List[DeadStockItem])
def get_dead_stock_report(
    days: int = Query(default=30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Subquery: products sold since cutoff
    active_product_ids = (
        db.query(SaleItem.product_id)
        .join(Sale, SaleItem.sale_id == Sale.id)
        .filter(Sale.date >= cutoff_date)
        .distinct()
        .all()
    )
    active_ids = {row[0] for row in active_product_ids}

    # Products in stock but not sold since cutoff
    dead_products = (
        db.query(Product)
        .filter(Product.stock_qty > 0, ~Product.id.in_(active_ids) if active_ids else True)
        .all()
    )

    out = []
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
            days_since = (datetime.now(timezone.utc) - last_sale[0]).days

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
    return out

@router.get("/outstanding-credit", response_model=List[OutstandingCreditItem])
def get_outstanding_credit_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    credit_customers = (
        db.query(Customer)
        .filter(Customer.credit_balance > 0)
        .order_by(desc(Customer.credit_balance))
        .all()
    )

    out = []
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
        if last_invoice:
            days_overdue = max(0, (datetime.now(timezone.utc) - last_invoice.date).days)

        out.append(
            OutstandingCreditItem(
                customer_id=c.id,
                customer_name=c.name,
                customer_phone=c.phone,
                customer_type=c.type,
                credit_balance=c.credit_balance,
                last_payment_date=last_payment.date if last_payment else None,
                days_overdue=days_overdue
            )
        )
    return out

@router.get("/low-stock", response_model=List[LowStockItem])
def get_low_stock_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    return out

@router.get("/profit-margin", response_model=ProfitMarginSummary)
def get_profit_margin_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale_items = db.query(SaleItem).all()

    total_revenue = 0.0
    total_cost = 0.0

    for item in sale_items:
        total_revenue += item.total
        if item.product:
            total_cost += item.qty * item.product.purchase_price

    gross_profit = total_revenue - total_cost
    margin_pct = (gross_profit / total_revenue * 100.0) if total_revenue > 0 else 0.0

    return ProfitMarginSummary(
        total_revenue=round(total_revenue, 2),
        total_cost_of_goods=round(total_cost, 2),
        gross_profit=round(gross_profit, 2),
        profit_margin_percentage=round(margin_pct, 2)
    )
