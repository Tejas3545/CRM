import React, { useState, useEffect } from 'react';
import { customerService, paymentService } from '../services/api';
import {
  Users,
  Plus,
  Search,
  IndianRupee,
  AlertCircle,
  FileText,
  CreditCard,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Edit,
  Trash2
} from 'lucide-react';

export default function CRM() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [hasUdhaarOnly, setHasUdhaarOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', type: 'Contractor', notes: '' });

  // Ledger & Payment Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [typeFilter, hasUdhaarOnly]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== 'All') params.customer_type = typeFilter;
      if (hasUdhaarOnly) params.has_udhaar_only = true;
      if (search) params.search = search;

      const res = await customerService.list(params);
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '', type: 'Contractor', notes: '' });
    setShowCustomerModal(true);
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      address: c.address || '',
      type: c.type,
      notes: c.notes || ''
    });
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, formData);
      } else {
        await customerService.create(formData);
      }
      setShowCustomerModal(false);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save customer');
    }
  };

  const openLedgerModal = async (c) => {
    setSelectedCustomer(c);
    try {
      const res = await customerService.getLedger(c.id);
      setLedgerSummary(res.data);
    } catch (err) {
      console.error('Failed to load ledger', err);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;

    try {
      await paymentService.recordPayment({
        customer_id: selectedCustomer.id,
        amount: Number(paymentAmount),
        mode: paymentMode,
        reference_no: paymentRef,
        notes: paymentNotes
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      
      // Refresh ledger & customer list
      openLedgerModal(selectedCustomer);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Payment recording failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            CRM & Udhaar Credit Ledger
          </h2>
          <p className="text-xs text-slate-400">Customer profiles, contractor history, credit balance tracking, and partial payment entry.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer Profile</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name, phone, or address..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={() => setHasUdhaarOnly(!hasUdhaarOnly)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              hasUdhaarOnly
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Outstanding Udhaar Only</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {['All', 'Contractor', 'Credit', 'Retail'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                typeFilter === t
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Cards Kanban Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading customer ledger records...</div>
      ) : customers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-12 text-center text-slate-500 space-y-2">
          <Users className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
          <p className="text-xs">No customer profiles found matching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => {
            const hasUdhaar = c.credit_balance > 0;
            return (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between shadow-sm transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      c.type === 'Contractor'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : c.type === 'Credit'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {c.type}
                    </span>

                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1 text-slate-500 hover:text-slate-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{c.name}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{c.phone}</span>
                    </div>
                    {c.address && (
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Udhaar Running Balance Box */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Udhaar Balance Owed:</span>
                    <span className={`font-bold font-mono text-sm ${hasUdhaar ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ₹ {c.credit_balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {c.notes && <p className="text-[11px] text-slate-500 italic truncate pt-1 border-t border-slate-800/60">{c.notes}</p>}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => openLedgerModal(c)}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded border border-slate-700 flex items-center justify-center space-x-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-orange-400" />
                    <span>View Full Ledger</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-100 text-sm">
                {editingCustomer ? 'Edit Customer Profile' : 'Create Customer Profile'}
              </h3>
              <button onClick={() => setShowCustomerModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Customer / Contractor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Verma Plumbing Contractors"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98990 11223"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Customer Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  >
                    <option value="Contractor">Contractor (B2B)</option>
                    <option value="Credit">Credit (Udhaar Account)</option>
                    <option value="Retail">Retail Walk-in</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Site / Shop Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Sector 15, Gurgaon"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Customer Notes</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Pays bi-weekly on Saturdays..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 text-white rounded font-semibold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger Modal */}
      {selectedCustomer && ledgerSummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  {selectedCustomer.name}'s Udhaar Ledger
                </h3>
                <p className="text-xs text-slate-400">Phone: {selectedCustomer.phone} | Type: {selectedCustomer.type}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {/* Ledger Metric Banner */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <div>
                <div className="text-[11px] text-slate-400">Total Billed Sales</div>
                <div className="text-base font-bold text-slate-100">₹ {ledgerSummary.total_billed_amount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Total Repaid</div>
                <div className="text-base font-bold text-emerald-400">₹ {ledgerSummary.total_paid_amount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Outstanding Udhaar</div>
                <div className="text-base font-bold text-amber-400">₹ {ledgerSummary.current_credit_balance.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Record Payment Button */}
            {selectedCustomer.credit_balance > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-md"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record Udhaar Payment</span>
                </button>
              </div>
            )}

            {/* Record Payment Modal Inside */}
            {showPaymentModal && (
              <form onSubmit={handleRecordPayment} className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-3 text-xs">
                <div className="font-bold text-emerald-400 border-b border-slate-800 pb-2">Record Partial / Full Repayment</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Amount Received (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder={`Max ₹${selectedCustomer.credit_balance}`}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-100"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI (GPay/PhonePe)</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Reference / UTR Number</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/3219481923"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-emerald-600 text-white rounded font-bold"
                  >
                    Save Repayment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
