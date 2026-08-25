import React, { useState, useEffect } from 'react';
import { customerService, paymentService } from '../services/api';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Phone,
  MessageSquare,
  Kanban,
  List,
  ChevronRight,
  X,
  UserCheck,
  Building2,
  Receipt
} from 'lucide-react';

export default function CRM() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  
  // View mode: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Customer Create/Edit Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    type: 'Contractor',
    credit_limit: 50000
  });

  // Payment Recording Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'Cash',
    reference: '',
    notes: ''
  });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.list();
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, customerForm);
      } else {
        await customerService.create(customerForm);
      }
      setShowCustomerModal(false);
      resetCustomerForm();
      loadCustomers();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save customer details.');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setErrorMsg('Please enter a valid payment amount.');
      return;
    }

    try {
      await paymentService.record({
        customer_id: paymentCustomer.id,
        amount: Number(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
        reference: paymentForm.reference,
        notes: paymentForm.notes
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', payment_mode: 'Cash', reference: '', notes: '' });
      loadCustomers();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to record payment.');
    }
  };

  const resetCustomerForm = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      type: 'Contractor',
      credit_limit: 50000
    });
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setCustomerForm({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      gstin: c.gstin || '',
      type: c.type || 'Contractor',
      credit_limit: c.credit_limit || 50000
    });
    setShowCustomerModal(true);
  };

  const openPaymentModal = (c) => {
    setPaymentCustomer(c);
    setPaymentForm({ amount: c.credit_balance.toString(), payment_mode: 'Cash', reference: '', notes: '' });
    setShowPaymentModal(true);
  };

  // Filtered List
  const filteredCustomers = customers.filter((c) => {
    const matchesType = selectedType === 'All' || c.type === selectedType;
    const matchesQuery =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesQuery;
  });

  // Kanban Columns Categorization based on Udhaar Credit Status
  const kanbanColumns = [
    {
      id: 'pending',
      title: '📝 Pending / New',
      bgColor: 'bg-slate-100/70 border-slate-200',
      headerBg: 'bg-slate-200 text-slate-800',
      items: filteredCustomers.filter(c => c.credit_balance === 0 && !c.phone)
    },
    {
      id: 'udhaar',
      title: '⚠️ High Udhaar Due',
      bgColor: 'bg-red-50/50 border-red-200',
      headerBg: 'bg-red-600 text-white',
      items: filteredCustomers.filter(c => c.credit_balance > 10000)
    },
    {
      id: 'partial',
      title: '💳 Partial Udhaar',
      bgColor: 'bg-amber-50/50 border-amber-200',
      headerBg: 'bg-amber-500 text-white',
      items: filteredCustomers.filter(c => c.credit_balance > 0 && c.credit_balance <= 10000)
    },
    {
      id: 'settled',
      title: '✅ Fully Settled',
      bgColor: 'bg-emerald-50/50 border-emerald-200',
      headerBg: 'bg-emerald-600 text-white',
      items: filteredCustomers.filter(c => c.credit_balance === 0 && c.phone)
    }
  ];

  return (
    <div className="p-3.5 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-red-600" />
            CRM & Udhaar Kanban Board
          </h2>
          <p className="text-xs text-slate-500 font-medium">Contractor credit ledger, payment collection & WhatsApp payment reminders.</p>
        </div>

        {/* Action Buttons & View Mode Switcher */}
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle: Kanban vs List */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                viewMode === 'kanban'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            onClick={() => {
              resetCustomerForm();
              setShowCustomerModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contractor</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contractor, plumber, GSTIN or phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {['All', 'Contractor', 'Plumber', 'Retail'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                selectedType === type
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN WORKFLOW BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => (
            <div
              key={col.id}
              className={`bg-white border ${col.bgColor} rounded-2xl p-3.5 space-y-3 min-h-[480px] shadow-xs flex flex-col`}
            >
              {/* Column Header */}
              <div className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between ${col.headerBg} shadow-2xs`}>
                <span>{col.title}</span>
                <span className="bg-white/30 text-white text-[11px] px-2 py-0.5 rounded-full font-mono">
                  {col.items.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {col.items.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium border-2 border-dashed border-slate-200 rounded-xl">
                    No records in this stage
                  </div>
                ) : (
                  col.items.map((cust) => (
                    <div
                      key={cust.id}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5 hover:shadow-md transition hover:border-red-400"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs leading-tight">{cust.name}</h4>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {cust.type}
                          </span>
                        </div>
                        <button
                          onClick={() => openEditModal(cust)}
                          className="text-[11px] text-slate-400 hover:text-slate-700 font-bold"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600">
                        {cust.phone && (
                          <div className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {cust.phone}
                          </div>
                        )}
                        {cust.gstin && (
                          <div className="flex items-center gap-1.5 font-mono text-slate-500">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            GST: {cust.gstin}
                          </div>
                        )}
                      </div>

                      {/* Udhaar Balance Pill */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Udhaar Balance</div>
                          <div className={`text-sm font-extrabold ${cust.credit_balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            ₹ {cust.credit_balance.toFixed(2)}
                          </div>
                        </div>

                        {cust.credit_balance > 0 ? (
                          <button
                            onClick={() => openPaymentModal(cust)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition"
                          >
                            Jama Payment
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Clean Ledger
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VIEW MODE 2: DIRECTORY LIST TABLE */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Contractor / Customer</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">GSTIN</th>
                  <th className="p-3.5">Credit Limit</th>
                  <th className="p-3.5">Udhaar Balance</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 font-medium">{c.phone || '-'}</td>
                    <td className="p-3.5 font-mono text-slate-600">{c.gstin || '-'}</td>
                    <td className="p-3.5 font-semibold text-slate-600">₹ {c.credit_limit.toLocaleString('en-IN')}</td>
                    <td className={`p-3.5 font-extrabold ${c.credit_balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹ {c.credit_balance.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {c.credit_balance > 0 && (
                        <button
                          onClick={() => openPaymentModal(c)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                        >
                          Jama
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(c)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Create/Edit Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingCustomer ? 'Edit Contractor Profile' : 'Add New Customer Profile'}
              </h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Plumber / Sharma Enterprises"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Category</label>
                  <select
                    value={customerForm.type}
                    onChange={(e) => setCustomerForm({ ...customerForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Contractor">Contractor / B2B</option>
                    <option value="Plumber">Plumber (Loyalty)</option>
                    <option value="Retail">Retail Walk-in</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={customerForm.gstin}
                    onChange={(e) => setCustomerForm({ ...customerForm, gstin: e.target.value })}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Udhaar Limit (₹)</label>
                  <input
                    type="number"
                    value={customerForm.credit_limit}
                    onChange={(e) => setCustomerForm({ ...customerForm, credit_limit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Billing Address</label>
                <textarea
                  rows="2"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="Address details..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-xs hover:from-red-700 hover:to-rose-700"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Jama Payment Modal */}
      {showPaymentModal && paymentCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Record Jama Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs space-y-0.5">
              <div className="font-extrabold text-slate-900">{paymentCustomer.name}</div>
              <div className="text-amber-800 font-semibold">
                Current Outstanding Udhaar: <span className="font-extrabold font-mono">₹ {paymentCustomer.credit_balance.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Received Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Mode</label>
                  <select
                    value={paymentForm.payment_mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ref / UTR No.</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="e.g. UPI-123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Jama Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
