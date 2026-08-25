import React, { useState, useEffect } from 'react';
import { supplierService, productService, purchaseService } from '../services/api';
import { Truck, Search, Plus, Trash2, CheckCircle2, X } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Tab State: 'suppliers' | 'new_purchase' | 'purchases_list'
  const [activeTab, setActiveTab] = useState('suppliers');

  // Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    gstin: ''
  });

  // New Purchase Entry State
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { product_id: '', qty: 1, unit_cost: 0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, pRes, purRes] = await Promise.all([
        supplierService.list(),
        productService.list(),
        purchaseService.list()
      ]);
      setSuppliers(sRes.data);
      setProducts(pRes.data);
      setPurchases(purRes.data);
    } catch (err) {
      console.error('Failed to load supplier data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await supplierService.create(supplierForm);
      setShowSupplierModal(false);
      setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '', gstin: '' });
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create supplier.');
    }
  };

  const addPurchaseRow = () => {
    setPurchaseItems([...purchaseItems, { product_id: '', qty: 1, unit_cost: 0 }]);
  };

  const updatePurchaseRow = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;

    if (field === 'product_id' && value) {
      const prod = products.find(p => p.id === Number(value));
      if (prod) {
        updated[index].unit_cost = prod.purchase_price;
      }
    }
    setPurchaseItems(updated);
  };

  const removePurchaseRow = (index) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseSupplierId) {
      setErrorMsg('Please select a supplier.');
      return;
    }
    if (purchaseItems.some(i => !i.product_id || i.qty <= 0)) {
      setErrorMsg('Please select valid products and quantities for all lines.');
      return;
    }

    try {
      const payload = {
        supplier_id: Number(purchaseSupplierId),
        invoice_no: invoiceNo || `PUR-${Date.now()}`,
        items: purchaseItems.map(i => ({
          product_id: Number(i.product_id),
          qty: Number(i.qty),
          unit_cost: Number(i.unit_cost)
        }))
      };

      await purchaseService.create(payload);
      setSuccessMsg('Purchase entry recorded & stock levels updated!');
      setPurchaseSupplierId('');
      setInvoiceNo('');
      setPurchaseItems([{ product_id: '', qty: 1, unit_cost: 0 }]);
      setActiveTab('purchases_list');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to record purchase entry.');
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone && s.phone.includes(searchQuery))
  );

  return (
    <div className="p-3.5 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-red-600" />
            Suppliers & Stock Purchase Orders
          </h2>
          <p className="text-xs text-slate-500 font-medium">Vendor profiles, stock inward entry & purchase order history.</p>
        </div>

        <button
          onClick={() => setShowSupplierModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
            activeTab === 'suppliers' ? 'bg-red-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Vendor Profiles ({suppliers.length})
        </button>

        <button
          onClick={() => setActiveTab('new_purchase')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
            activeTab === 'new_purchase' ? 'bg-red-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          + Record Stock Inward Purchase
        </button>

        <button
          onClick={() => setActiveTab('purchases_list')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
            activeTab === 'purchases_list' ? 'bg-red-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Purchase History ({purchases.length})
        </button>
      </div>

      {/* TAB 1: SUPPLIER PROFILES */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name or phone..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 hover:shadow-md transition">
                <div className="font-extrabold text-slate-900 text-sm">{s.name}</div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Contact: <span className="font-semibold text-slate-800">{s.contact_person || 'N/A'}</span></div>
                  <div>Phone: <span className="font-mono font-semibold text-slate-800">{s.phone || 'N/A'}</span></div>
                  <div>GSTIN: <span className="font-mono font-semibold text-slate-800">{s.gstin || 'N/A'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RECORD NEW STOCK PURCHASE */}
      {activeTab === 'new_purchase' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
          <h3 className="font-extrabold text-slate-900 text-base">New Stock Inward Purchase Entry</h3>

          <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Supplier Vendor *</label>
                <select
                  required
                  value={purchaseSupplierId}
                  onChange={(e) => setPurchaseSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Vendor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.gstin ? `(${s.gstin})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Supplier Bill / Invoice No.</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. ASTRAL-PUR-9982"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs">Stock Items Included:</span>
                <button
                  type="button"
                  onClick={addPurchaseRow}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  + Add Item Line
                </button>
              </div>

              {purchaseItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="col-span-6 sm:col-span-6">
                    <select
                      value={item.product_id}
                      onChange={(e) => updatePurchaseRow(idx, 'product_id', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900"
                    >
                      <option value="">Select Stock Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => updatePurchaseRow(idx, 'qty', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost (₹)"
                      value={item.unit_cost}
                      onChange={(e) => updatePurchaseRow(idx, 'unit_cost', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    {purchaseItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePurchaseRow(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
              >
                Save Stock Inward Purchase Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PURCHASE HISTORY LIST */}
      {activeTab === 'purchases_list' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Invoice No</th>
                  <th className="p-3.5">Supplier Vendor</th>
                  <th className="p-3.5">Items Purchased</th>
                  <th className="p-3.5">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold font-mono text-slate-900">{pur.invoice_no}</td>
                    <td className="p-3.5 font-bold text-slate-800">{pur.supplier_name || 'Vendor'}</td>
                    <td className="p-3.5">{pur.items?.length || 0} Products</td>
                    <td className="p-3.5 font-extrabold text-slate-900">₹ {pur.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Add New Supplier Vendor Profile</h3>
              <button onClick={() => setShowSupplierModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Vendor / Company Name *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g. Supreme Industries Ltd."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supplierForm.contact_person}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={supplierForm.gstin}
                  onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value })}
                  placeholder="07AAAAA0000A1Z5"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
