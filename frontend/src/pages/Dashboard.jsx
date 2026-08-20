import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService, saleService } from '../services/api';
import {
  IndianRupee,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  Users,
  Package,
  ArrowUpRight,
  PlusCircle,
  Clock,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, lowRes, topRes, salesRes] = await Promise.all([
        reportService.getDashboard(),
        reportService.getLowStock(),
        reportService.getTopSelling(5),
        saleService.list()
      ]);

      setSummary(sumRes.data);
      setLowStock(lowRes.data);
      setTopSellers(topRes.data);
      setRecentSales(salesRes.data.slice(0, 5));
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center min-h-[400px]">
        <div className="space-y-2">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm">Loading hardware dashboard analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Overview Dashboard</h2>
          <p className="text-sm text-slate-400">Real-time inventory stock, daily billing summary, and udhaar credit ledger.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-950/40 text-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New POS Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">₹ {summary?.today_sales_total.toLocaleString('en-IN') || '0'}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>{summary?.today_sales_count || 0} Bills Generated Today</span>
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Month to Date</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">₹ {summary?.monthly_sales_total.toLocaleString('en-IN') || '0'}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Current Month Sales Revenue</span>
          </div>
        </div>

        {/* Outstanding Udhaar Credit */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Udhaar Owed</span>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">₹ {summary?.total_outstanding_credit.toLocaleString('en-IN') || '0'}</div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Customer Ledger Balance</span>
            <button onClick={() => navigate('/crm')} className="text-amber-400 font-medium hover:underline flex items-center text-[11px]">
              View CRM <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Items</span>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-400">{summary?.low_stock_count || 0}</div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Items below threshold</span>
            <button onClick={() => navigate('/inventory')} className="text-red-400 font-medium hover:underline flex items-center text-[11px]">
              Restock <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Board Layout (Kanban Structural Aesthetic) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts Card Board */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Low Stock Alerts
            </h3>
            <span className="text-xs bg-red-500/10 text-red-400 font-semibold px-2 py-0.5 rounded border border-red-500/20">
              {lowStock.length} Items
            </span>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">All inventory products are above minimum threshold.</p>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {lowStock.map((item) => (
                <div key={item.product_id} className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between hover:border-slate-700 transition">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200">{item.product_name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="font-mono text-slate-500">{item.product_sku}</span>
                      <span>Category: {item.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-red-400">
                      {item.stock_qty} {item.unit}
                    </div>
                    <div className="text-[10px] text-slate-500">Min: {item.low_stock_threshold}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-400" />
              Top Fast-Moving Hardware
            </h3>
            <span className="text-xs text-slate-400">By Quantity</span>
          </div>

          {topSellers.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No sales recorded yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {topSellers.map((item, idx) => (
                <div key={item.product_id} className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold font-mono text-slate-500 bg-slate-800 w-5 h-5 rounded flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{item.product_name}</div>
                      <div className="text-[11px] text-slate-400">{item.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-100">{item.total_qty_sold} Units</div>
                    <div className="text-[11px] text-emerald-400">₹ {item.total_revenue.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Recent POS Invoices
            </h3>
            <button onClick={() => navigate('/reports')} className="text-xs text-orange-400 hover:underline">
              View All
            </button>
          </div>

          {recentSales.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {recentSales.map((sale) => (
                <div key={sale.id} className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200 font-mono">{sale.invoice_no}</div>
                    <div className="text-[11px] text-slate-400">{sale.customer_name || 'Walk-in Retail'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-100">₹ {sale.total.toLocaleString('en-IN')}</div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                      sale.payment_type === 'Credit'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {sale.payment_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
