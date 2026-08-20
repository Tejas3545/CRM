from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.purchase import Purchase, PurchaseItem
from app.models.sale import Sale, SaleItem
from app.models.payment import Payment
from app.models.stock_adjustment import StockAdjustment
from datetime import datetime, timedelta, timezone

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create Default Users (Owner + Staff)
        owner = db.query(User).filter(User.username == "admin").first()
        if not owner:
            owner = User(
                username="admin",
                email="owner@apexhardware.in",
                full_name="Rajesh Sharma (Owner)",
                hashed_password=get_password_hash("admin123"),
                role="Owner",
                is_active=True
            )
            db.add(owner)
        
        staff = db.query(User).filter(User.username == "cashier").first()
        if not staff:
            staff = User(
                username="cashier",
                email="cashier@apexhardware.in",
                full_name="Amit Kumar (Cashier)",
                hashed_password=get_password_hash("staff123"),
                role="Staff",
                is_active=True
            )
            db.add(staff)
        
        db.commit()

        # Check if already seeded data exists
        if db.query(Product).count() > 0:
            print("Database already contains records. Skipping sample seeding.")
            return

        print("Seeding realistic Plumbing & Hardware Shop demonstration data...")

        # 2. Seed Suppliers
        s1 = Supplier(name="Astral Pipes Ltd Distributor", contact_person="Ramesh Gupta", phone="+91 98100 12345", email="orders@astraldist.in", address="Plot 45, Wazirpur Industrial Area, Delhi")
        s2 = Supplier(name="Jaquar Sanitation & Fittings", contact_person="Vikram Malhotra", phone="+91 98111 23456", email="delhi.sales@jaquar.com", address="B-12, Mayapuri Phase II, Delhi")
        s3 = Supplier(name="Supreme Plastics & Valves", contact_person="Suresh Patel", phone="+91 98222 34567", email="supreme.delhi@supreme.co.in", address="C-8, Okhla Industrial Area, Delhi")
        db.add_all([s1, s2, s3])
        db.commit()

        # 3. Seed Products across Plumbing categories
        products_data = [
            # Pipes
            Product(sku="PIP-CPVC-075-3M", barcode="89010010001", name="Astral CPVC Pipe 3/4 inch (3 Meter)", category="Pipes", brand="Astral", unit="piece", purchase_price=180.0, selling_price=240.0, gst_rate=18.0, hsn_code="3917", stock_qty=85.0, low_stock_threshold=20.0, supplier_id=s1.id),
            Product(sku="PIP-CPVC-100-3M", barcode="89010010002", name="Astral CPVC Pipe 1 inch (3 Meter)", category="Pipes", brand="Astral", unit="piece", purchase_price=260.0, selling_price=350.0, gst_rate=18.0, hsn_code="3917", stock_qty=42.0, low_stock_threshold=15.0, supplier_id=s1.id),
            Product(sku="PIP-PVC-4IN-10FT", barcode="89010010003", name="Supreme PVC Agri Pipe 4 inch 10ft", category="Pipes", brand="Supreme", unit="piece", purchase_price=420.0, selling_price=560.0, gst_rate=18.0, hsn_code="3917", stock_qty=6.0, low_stock_threshold=10.0, supplier_id=s3.id), # Low stock!

            # Fittings
            Product(sku="FIT-CPVC-ELB-075", barcode="89010010004", name="CPVC Elbow 3/4 inch 90 Deg", category="Fittings", brand="Astral", unit="piece", purchase_price=12.0, selling_price=18.0, gst_rate=18.0, hsn_code="3917", stock_qty=350.0, low_stock_threshold=50.0, supplier_id=s1.id),
            Product(sku="FIT-CPVC-TEE-075", barcode="89010010005", name="CPVC Equal Tee 3/4 inch", category="Fittings", brand="Astral", unit="piece", purchase_price=16.0, selling_price=25.0, gst_rate=18.0, hsn_code="3917", stock_qty=180.0, low_stock_threshold=40.0, supplier_id=s1.id),
            Product(sku="FIT-BRS-FTA-075", barcode="89010010006", name="CPVC Brass FTA 3/4 inch", category="Fittings", brand="Astral", unit="piece", purchase_price=65.0, selling_price=95.0, gst_rate=18.0, hsn_code="7412", stock_qty=95.0, low_stock_threshold=20.0, supplier_id=s1.id),

            # Valves
            Product(sku="VLV-BRS-BAL-075", barcode="89010010007", name="Heavy Brass Ball Valve 3/4 inch", category="Valves", brand="Zoloto", unit="piece", purchase_price=220.0, selling_price=320.0, gst_rate=18.0, hsn_code="8481", stock_qty=24.0, low_stock_threshold=8.0, supplier_id=s3.id),
            Product(sku="VLV-CON-NRV-100", barcode="89010010008", name="Horizontal Non Return Valve 1 inch", category="Valves", brand="Leader", unit="piece", purchase_price=310.0, selling_price=450.0, gst_rate=18.0, hsn_code="8481", stock_qty=4.0, low_stock_threshold=5.0, supplier_id=s3.id), # Low stock!

            # Taps
            Product(sku="TAP-BRS-BIB-050", barcode="89010010009", name="Jaquar Brass Bib Cock Tap 1/2 inch", category="Taps", brand="Jaquar", unit="piece", purchase_price=550.0, selling_price=780.0, gst_rate=18.0, hsn_code="8481", stock_qty=18.0, low_stock_threshold=5.0, supplier_id=s2.id),
            Product(sku="TAP-PILLAR-ANGLE", barcode="89010010010", name="Jaquar Angular Stop Cock Chrome", category="Taps", brand="Jaquar", unit="piece", purchase_price=480.0, selling_price=690.0, gst_rate=18.0, hsn_code="8481", stock_qty=15.0, low_stock_threshold=5.0, supplier_id=s2.id),

            # Cement / Adhesives
            Product(sku="ADH-CPVC-SLV-500ML", barcode="89010010011", name="Solvent Cement Tin 500ml", category="Cement/Adhesives", brand="Weld-On", unit="piece", purchase_price=210.0, selling_price=290.0, gst_rate=18.0, hsn_code="3506", stock_qty=32.0, low_stock_threshold=10.0, supplier_id=s1.id),
            Product(sku="ADH-TEP-TAPE-12M", barcode="89010010012", name="Teflon Thread Seal Tape 12m Roll", category="Cement/Adhesives", brand="Champion", unit="piece", purchase_price=8.0, selling_price=15.0, gst_rate=18.0, hsn_code="3926", stock_qty=450.0, low_stock_threshold=100.0, supplier_id=s1.id),

            # Sanitary Ware & Tools
            Product(sku="SAN-WSH-BASIN-WHITE", barcode="89010010013", name="Cera Oval Wash Basin White", category="Sanitary Ware", brand="Cera", unit="piece", purchase_price=1250.0, selling_price=1750.0, gst_rate=28.0, hsn_code="6910", stock_qty=8.0, low_stock_threshold=3.0, supplier_id=s2.id),
            Product(sku="TOO-WRN-PIPE-14IN", barcode="89010010014", name="Taparia Heavy Duty Pipe Wrench 14 inch", category="Tools", brand="Taparia", unit="piece", purchase_price=680.0, selling_price=920.0, gst_rate=18.0, hsn_code="8204", stock_qty=12.0, low_stock_threshold=3.0, supplier_id=s3.id),
        ]
        db.add_all(products_data)
        db.commit()

        # 4. Seed Customers (Retail, Contractor, Credit Udhaar)
        c1 = Customer(name="Verma Plumbing Contractors", phone="+91 98990 11223", address="Sector 15, Gurgaon", type="Contractor", credit_balance=14850.0, notes="Preferred contractor. Pays bi-weekly on Saturdays.")
        c2 = Customer(name="Sharma Sanitary & Civil Works", phone="+91 98770 33445", address="Rohini Sector 7, Delhi", type="Credit", credit_balance=28400.0, notes="Udhaar account. Frequent buyer for apartment projects.")
        c3 = Customer(name="Anil Kumar (Plumber)", phone="+91 98110 55667", address="Laxmi Nagar, Delhi", type="Contractor", credit_balance=0.0, notes="Pays cash on delivery.")
        c4 = Customer(name="Sunil Mehta (Retail Owner)", phone="+91 98330 77889", address="Pitampura, Delhi", type="Retail", credit_balance=0.0, notes="Walk-in retail buyer.")
        db.add_all([c1, c2, c3, c4])
        db.commit()

        # 5. Seed Initial Transactions & Payments
        # Sale 1 (Credit sale for Sharma Sanitary Works 5 days ago)
        sale1_date = datetime.now(timezone.utc) - timedelta(days=5)
        s1_obj = Sale(
            invoice_no=f"INV-{sale1_date.strftime('%Y%m%d')}-0001",
            customer_id=c2.id,
            date=sale1_date,
            subtotal=24000.0,
            gst_amount=4320.0,
            discount=0.0,
            total=28320.0,
            payment_type="Credit",
            amount_paid=0.0,
            payment_status="Unpaid"
        )
        db.add(s1_obj)
        db.flush()

        p_cpvc = products_data[0]
        p_ftg = products_data[3]
        item1 = SaleItem(sale_id=s1_obj.id, product_id=p_cpvc.id, qty=80.0, unit_price=240.0, gst_rate=18.0, gst_amount=3456.0, discount=0.0, total=22656.0)
        item2 = SaleItem(sale_id=s1_obj.id, product_id=p_ftg.id, qty=250.0, unit_price=18.0, gst_rate=18.0, gst_amount=810.0, discount=0.0, total=5310.0)
        db.add_all([item1, item2])

        # Sale 2 (Contractor partial payment sale)
        sale2_date = datetime.now(timezone.utc) - timedelta(days=2)
        s2_obj = Sale(
            invoice_no=f"INV-{sale2_date.strftime('%Y%m%d')}-0002",
            customer_id=c1.id,
            date=sale2_date,
            subtotal=16000.0,
            gst_amount=2880.0,
            discount=500.0,
            total=18380.0,
            payment_type="Credit",
            amount_paid=3530.0,
            payment_status="Partial"
        )
        db.add(s2_obj)
        db.flush()

        # Payment record for partial payment
        pay1 = Payment(
            customer_id=c1.id,
            linked_invoice_id=s2_obj.id,
            amount=3530.0,
            mode="UPI",
            date=sale2_date,
            reference_no="UPI/32184918239/VERMA",
            notes="Partial payment received via GPay"
        )
        db.add(pay1)

        db.commit()
        print("Successfully seeded demonstration data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
