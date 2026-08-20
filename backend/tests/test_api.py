import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_login_and_auth():
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "Owner"

    token = data["access_token"]

    # Read current user with token
    me_resp = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "admin"

def test_products_list_and_lookup():
    login_resp = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List products
    resp = client.get(f"{settings.API_V1_STR}/products", headers=headers)
    assert resp.status_code == 200
    products = resp.json()
    assert len(products) > 0

    # SKU Lookup
    sku = products[0]["sku"]
    lookup_resp = client.get(f"{settings.API_V1_STR}/products/lookup/{sku}", headers=headers)
    assert lookup_resp.status_code == 200
    assert lookup_resp.json()["sku"] == sku

def test_pos_billing_and_stock_deduction():
    login_resp = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch product & customer
    prods = client.get(f"{settings.API_V1_STR}/products", headers=headers).json()
    custs = client.get(f"{settings.API_V1_STR}/customers", headers=headers).json()

    target_prod = prods[0]
    initial_stock = target_prod["stock_qty"]
    target_cust = custs[0]
    initial_credit = target_cust["credit_balance"]

    # Create POS sale invoice on Credit
    sale_payload = {
        "customer_id": target_cust["id"],
        "payment_type": "Credit",
        "amount_paid": 0.0,
        "discount": 0.0,
        "items": [
            {
                "product_id": target_prod["id"],
                "qty": 2.0,
                "unit_price": target_prod["selling_price"],
                "discount": 0.0
            }
        ]
    }

    sale_resp = client.post(f"{settings.API_V1_STR}/sales", json=sale_payload, headers=headers)
    assert sale_resp.status_code == 201
    sale_data = sale_resp.json()
    assert sale_data["payment_status"] in ["Unpaid", "Credit"]

    # Verify stock decremented by 2.0
    updated_prod = client.get(f"{settings.API_V1_STR}/products/{target_prod['id']}", headers=headers).json()
    assert updated_prod["stock_qty"] == pytest.approx(initial_stock - 2.0)

    # Verify customer credit balance increased
    updated_cust = client.get(f"{settings.API_V1_STR}/customers/{target_cust['id']}", headers=headers).json()
    assert updated_cust["credit_balance"] == pytest.approx(initial_credit + sale_data["total"])
