import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Plumbing CRM & Inventory Management"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "plumbing_hardware_secret_key_change_in_production_123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for ease of use
    
    # Use temporary storage on Vercel; keep the local database for development.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:////tmp/crm_inventory.db" if os.getenv("VERCEL") else "sqlite:///./crm_inventory.db"
    )

    # Preview deployment options
    DEMO_MODE: bool = False
    FRONTEND_URL: str = ""
    
    # Shop details for GST invoicing
    SHOP_NAME: str = "Apex Plumbing & Hardware Stores"
    SHOP_ADDRESS: str = "Shop No. 12-14, Hardware Market, Ring Road, New Delhi - 110015"
    SHOP_PHONE: str = "+91 98765 43210"
    SHOP_EMAIL: str = "billing@apexhardware.in"
    SHOP_GSTIN: str = "07AAAAA0000A1Z5"
    SHOP_STATE: str = "Delhi (07)"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
