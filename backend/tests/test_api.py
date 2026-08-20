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

    me_resp = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "admin"

def test_all_report_endpoints():
    login_resp = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash = client.get(f"{settings.API_V1_STR}/reports/dashboard", headers=headers)
    assert dash.status_code == 200

    top = client.get(f"{settings.API_V1_STR}/reports/top-selling", headers=headers)
    assert top.status_code == 200

    dead = client.get(f"{settings.API_V1_STR}/reports/dead-stock", headers=headers)
    assert dead.status_code == 200

    credit = client.get(f"{settings.API_V1_STR}/reports/outstanding-credit", headers=headers)
    assert credit.status_code == 200

    low = client.get(f"{settings.API_V1_STR}/reports/low-stock", headers=headers)
    assert low.status_code == 200

    profit = client.get(f"{settings.API_V1_STR}/reports/profit-margin", headers=headers)
    assert profit.status_code == 200
