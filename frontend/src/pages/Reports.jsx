import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  Archive,
  IndianRupee,
  Calendar,
  Clock
} from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('top-selling');
  const [topSellers, setTopSellers] = useState([]);
  const [deadStock, setDeadStock] = useState([]);
  const [outstandingCredit, setOutstandingCredit] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [profitSummary, setProfitSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'top-selling') {
        const res = await reportService.getTopSelling(20);
        setTopSellers(res.data);
      } else if (activeTab === 'dead-stock') {
        const res = await reportService.getDeadStock(30);
        setDeadStock(res.data);
      } else if (activeTab === 'outstanding-credit') {
        const res = await reportService.getOutstandingCredit();
        setOutstandingCredit(res.data);
      } else if (activeTab === 'low-stock') {
        const res = await reportService.getLowStock();
        setLowStock(res.data);
      } else if (activeTab === 'profit-margin') {
        const res = await reportService.getProfitMargin();
        setProfitSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-orange-500" />
          Business Reports & Analytics
        </h2>
        <p className="text-xs text-slate-400">Sales trends, dead stock holding value, customer udhaar reports, and profit margins.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: 'top-selling', label: 'Top Fast-Moving', icon: TrendingUp },
          { id: 'outstanding-credit', label: 'Customer Udhaar Credit', icon: Users },
          { id: 'profit-margin', label: 'Profit Margins', icon: IndianRupee },
          { id: 'dead-stock', label: 'Dead Stock Report', icon: Archive },
          { id: 'low-stock', label: 'Low Stock Items', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition border-t border-x ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-orange-400 border-slate-800 border-b-slate-900 -mb-px'
                  : 'bg-slate-950 text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Generating business report...</div>
        ) : activeTab === 'top-selling' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-100">Fastest Moving Products (Ranked by Units Sold)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Units Sold</th>
                    <th className="p-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {topSellers.map((item, idx) => (
                    <tr key={item.product_id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-mono text-orange-400 font-bold">{item.product_sku}</td>
                      <td className="p-3 font-bold text-slate-100">{item.product_name}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3 text-right font-bold">{item.total_qty_sold}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">₹ {item.total_revenue.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'outstanding-credit' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-100">Outstanding Customer Credit (Udhaar) Report</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Last Payment</th>
                    <th className="p-3 text-right">Udhaar Balance Owed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {outstandingCredit.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-bold text-slate-100">{c.customer_name}</td>
                      <td className="p-3 text-slate-400">{c.customer_phone}</td>
                      <td className="p-3">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                          {c.customer_type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{c.last_payment_date ? new Date(c.last_payment_date).toLocaleDateString() : 'None'}</td>
                      <td className="p-3 text-right font-bold text-amber-400 font-mono text-sm">
                        ₹ {c.credit_balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'profit-margin' && profitSummary ? (
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-slate-100">Profit Margin Overview</h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Total Revenue</div>
                <div className="text-xl font-bold text-slate-100 mt-1">₹ {profitSummary.total_revenue.toLocaleString('en-IN')}</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Cost of Goods Sold</div>
                <div className="text-xl font-bold text-slate-400 mt-1">₹ {profitSummary.total_cost_of_goods.toLocaleString('en-IN')}</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 text-center">
                <div className="text-xs text-slate-400">Gross Profit</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">₹ {profitSummary.gross_profit.toLocaleString('en-IN')}</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-orange-500/30 text-center">
                <div className="text-xs text-slate-400">Gross Margin %</div>
                <div className="text-xl font-bold text-orange-400 mt-1">{profitSummary.profit_margin_percentage}%</div>
              </div>
            </div>
          </div>
        ) : activeTab === 'dead-stock' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-100">Dead Stock Report (Products In-Stock with No Sales in 30+ Days)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">In Stock</th>
                    <th className="p-3 text-right">Purchase Price</th>
                    <th className="p-3 text-right">Holding Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {deadStock.map((item) => (
                    <tr key={item.product_id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-mono font-bold text-slate-400">{item.product_sku}</td>
                      <td className="p-3 font-bold text-slate-100">{item.product_name}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3 text-right font-bold">{item.stock_qty} {item.unit}s</td>
                      <td className="p-3 text-right font-mono">₹ {item.purchase_price}</td>
                      <td className="p-3 text-right font-bold text-red-400 font-mono">
                        ₹ {item.holding_value.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-100">Low Stock Re-order Report</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3 text-right">Current Stock</th>
                    <th className="p-3 text-right">Min Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lowStock.map((item) => (
                    <tr key={item.product_id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-mono font-bold text-red-400">{item.product_sku}</td>
                      <td className="p-3 font-bold text-slate-100">{item.product_name}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3 text-slate-400">{item.supplier_name || 'N/A'}</td>
                      <td className="p-3 text-right font-bold text-red-400">{item.stock_qty} {item.unit}</td>
                      <td className="p-3 text-right font-mono">{item.low_stock_threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
