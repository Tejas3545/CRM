import React, { useState, useEffect } from 'react';
import { reportService, saleService } from '../services/api';
import { BarChart3, FileText, Printer, Download, FileSpreadsheet, Calendar, Search, Filter } from 'lucide-react';

export default function Reports() {
  const [salesReport, setSalesReport] = useState({
    total_sales: 0,
    total_invoices: 0,
    total_discount: 0,
    by_payment_type: {},
    invoices: []
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedPaymentType !== 'All') params.payment_type = selectedPaymentType;

      const res = await reportService.getSalesReport(params);
      setSalesReport(res.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadReports();
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPaymentType('All');
    loadReports();
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-600" />
            Vyapar GST Reports & Sales Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium">GSTR-1 GST tax summaries, daily cash audit & PDF tax invoices.</p>
        </div>
      </div>

      {/* Date Filter & Options Form */}
      <form onSubmit={handleFilterSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-end justify-between text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto flex-1">
          <div>
            <label className="block font-bold text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Mode Filter</label>
            <select
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="All">All Modes (Cash, Credit, UPI)</option>
              <option value="Cash">Cash Only</option>
              <option value="Credit">Credit (Udhaar)</option>
              <option value="UPI">UPI / Digital</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-xs hover:from-red-700 hover:to-rose-700"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
          >
            Reset
          </button>
        </div>
      </form>

      {/* 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Filtered Total Sales</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹ {salesReport.total_sales ? salesReport.total_sales.toLocaleString('en-IN') : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Total revenue across selected range</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Invoices Issued</div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">
            {salesReport.total_invoices || 0} <span className="text-xs font-semibold text-slate-500">Bills</span>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Valid GST bills generated</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Discounts Given</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹ {salesReport.total_discount ? salesReport.total_discount.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Special promotional discounts</div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm">Detailed Invoices Ledger</h3>
          <span className="text-xs font-semibold text-slate-500">{salesReport.invoices.length} Invoices Found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Invoice No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5 text-right">PDF Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesReport.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold font-mono text-slate-900">{inv.invoice_no}</td>
                  <td className="p-3.5 font-mono text-slate-500">
                    {new Date(inv.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">{inv.customer_name || 'Walk-in Retail'}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.payment_type === 'Credit' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {inv.payment_type}
                    </span>
                  </td>
                  <td className="p-3.5 font-extrabold text-slate-900">₹ {inv.total.toFixed(2)}</td>
                  <td className="p-3.5 text-right">
                    <a
                      href={saleService.getPdfUrl(inv.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
