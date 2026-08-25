import React, { useState, useEffect } from 'react';
import { reportService, saleService, customerService, productService } from '../services/api';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  FileText,
  CreditCard,
  Package,
  Store,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    today_sales: 0,
    today_sales_count: 0,
    today_collections: 0,
    total_receivable_credit: 0,
    low_stock_count: 0
  });

  const [recentSales, setRecentSales] = useState([]);
  const [creditCustomers, setCreditCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, salesRes, custRes] = await Promise.all([
        reportService.getSummary(),
        saleService.listInvoices(),
        customerService.list()
      ]);

      setSummary(sumRes.data);
      setRecentSales(salesRes.data.slice(0, 5));
      setCreditCustomers(custRes.data.filter(c => c.credit_balance > 0).slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold text-xl shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Vyapar Business Dashboard</h2>
            <p className="text-xs font-semibold text-slate-500">Apex Plumbing Hardware & Retail • Real-time Billing Overview</p>
          </div>
        </div>

        {/* Quick Primary POS Action Button */}
        <Link
          to="/pos"
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow-md flex items-center justify-center space-x-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create GST Invoice</span>
        </Link>
      </div>

      {/* 4 Vyapar-Inspired Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-red-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ₹ {summary.today_sales ? summary.today_sales.toLocaleString('en-IN') : '0'}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
              <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[11px]">
                {summary.today_sales_count} Bills
              </span>
              <span>generated today</span>
            </div>
          </div>
          <div className="h-1 w-full bg-red-500 rounded-full mt-3"></div>
        </div>

        {/* Card 2: Cash & Bank Collections */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              ₹ {summary.today_collections ? summary.today_collections.toLocaleString('en-IN') : '0'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>Cash & UPI payments received</span>
            </div>
          </div>
          <div className="h-1 w-full bg-emerald-500 rounded-full mt-3"></div>
        </div>

        {/* Card 3: Udhaar Credit Receivable */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Udhaar Due</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              ₹ {summary.total_receivable_credit ? summary.total_receivable_credit.toLocaleString('en-IN') : '0'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>Pending contractor credit balance</span>
            </div>
          </div>
          <div className="h-1 w-full bg-amber-500 rounded-full mt-3"></div>
        </div>

        {/* Card 4: Low Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {summary.low_stock_count} <span className="text-xs font-semibold text-slate-500">Items</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>Requires vendor restocking</span>
            </div>
          </div>
          <div className="h-1 w-full bg-blue-500 rounded-full mt-3"></div>
        </div>
      </div>

      {/* Quick Action Grid (Vyapar Style Shortcut Tiles) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">Quick Vyapar Shortcuts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/pos"
            className="p-3.5 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-700 flex flex-col items-center justify-center text-center space-y-1.5 transition font-bold text-xs shadow-2xs"
          >
            <ShoppingCart className="w-6 h-6 text-red-600" />
            <span>Fast POS Billing</span>
          </Link>

          <Link
            to="/crm"
            className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 text-amber-700 flex flex-col items-center justify-center text-center space-y-1.5 transition font-bold text-xs shadow-2xs"
          >
            <Users className="w-6 h-6 text-amber-600" />
            <span>Udhaar Kanban Board</span>
          </Link>

          <Link
            to="/inventory"
            className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center text-center space-y-1.5 transition font-bold text-xs shadow-2xs"
          >
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Manage Stock Items</span>
          </Link>

          <Link
            to="/reports"
            className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700 flex flex-col items-center justify-center text-center space-y-1.5 transition font-bold text-xs shadow-2xs"
          >
            <FileText className="w-6 h-6 text-blue-600" />
            <span>GSTR & Tax Reports</span>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Sales vs Udhaar Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Recent Bills */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-red-600" />
              Recent GST Invoices
            </h3>
            <Link to="/reports" className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 overflow-x-auto">
            {recentSales.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No sales recorded today.</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 font-mono">{sale.invoice_no}</div>
                    <div className="text-[11px] text-slate-500">{sale.customer_name || 'Walk-in Retail Buyer'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900">₹ {sale.total.toFixed(2)}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sale.payment_type === 'Credit' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {sale.payment_type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 5 Cols: Top Udhaar Contractors */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Udhaar Credit Debtors
            </h3>
            <Link to="/crm" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1">
              Open Board <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {creditCustomers.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All contractor accounts fully settled!</p>
            ) : (
              creditCustomers.map((cust) => (
                <div key={cust.id} className="p-3 rounded-xl border border-amber-100 bg-amber-50/30 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{cust.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cust.phone || 'No phone'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-amber-700">₹ {cust.credit_balance.toFixed(2)}</div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      Owes Udhaar
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
