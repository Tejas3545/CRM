# 🛠️ Apex Plumbing & Hardware — Full-Stack CRM + Inventory Management System

A production-grade, single integrated CRM and Inventory Management System designed specifically for plumbing hardware retail & wholesale businesses. Built with **FastAPI**, **React (Vite)**, **Tailwind CSS**, and **SQLAlchemy**.

---

## 🌟 Key Features & Business Modules

- **⚡ Fast POS Billing Terminal**: Quick barcode / SKU scanner support, automatic GST calculation (5%, 12%, 18%, 28%) with HSN codes, instant discount handling, and print-ready PDF invoice generation.
- **📦 Inventory Stock Management**: Categorized product catalog (Pipes, Fittings, Valves, Taps, Cement/Adhesives, Sanitary Ware, Tools, Electricals, Misc) with real-time stock level tracking and low-stock alerts.
- **🔄 Bulk-to-Unit Conversion**: Convert bulk purchase items (e.g. pipe bought by 100m bundle) into sellable unit quantities (meters) seamlessly.
- **👥 CRM & Udhaar Ledger**: Complete customer profile management (Retail, Contractor, Credit) with running credit balance tracking, payment history, and partial udhaar repayment recording.
- **🚚 Supplier & Stock-In Purchases**: Vendor directory management and stock-in purchase entry that automatically increments inventory stock and updates cost prices in real-time.
- **📊 Business Analytics & Reports**: Top fast-moving products, dead stock holding cost analysis, customer udhaar reports, low stock re-order lists, and gross profit margin insights.

---

## 🏗️ Tech Stack & Architecture

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide SVG Line Icons, Axios, React Router v7.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, ReportLab (GST PDF Invoices), Passlib, Python-JOSE (JWT Auth).
- **Database**: SQLAlchemy 2.0 + Alembic (configured for PostgreSQL; defaults to local SQLite for instant zero-config execution).

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Seed realistic demonstration data (Products, Customers, Suppliers, Sales)
python -m app.seed

# Start FastAPI server
python -m uvicorn app.main:app --reload
```

Backend API Docs (Swagger): `http://127.0.0.1:8000/api/v1/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend App: `http://localhost:5173`

---

## 🔐 Default Demo Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Owner / Admin** | `admin` | `admin123` |
| **Cashier / Staff** | `cashier` | `staff123` |

---

## 📄 GST Tax Invoice PDF

Every POS sale generates a GST-compliant PDF invoice featuring shop header, GSTIN, customer details, CGST/SGST/IGST tax split, and itemized HSN breakdown ready for instant printing or sharing.

---

## 📜 License

MIT License. Built for real-world hardware shop operations.
