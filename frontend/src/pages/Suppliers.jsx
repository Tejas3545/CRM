import React, { useState, useEffect } from 'react';
import { supplierService, productService, purchaseService } from '../services/api';
import {
  Truck,
  Plus,
  PackageCheck,
  Search,
  Phone,
  Mail,
  MapPin,
  X,
  FilePlus,
  CheckCircle2
} from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { product_id: '', qty: 1, cost_price: 0 }
  ]);
  const [purchaseNotes, setPurchaseNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      console.error('Failed to load supplier/purchase data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await supplierService.create(supplierForm);
      setShowSupplierModal(false);
      setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
      fetchData();
    } catch (err) {
      alert('Failed to save supplier');
    }
  };

  const addPurchaseLine = () => {
    setPurchaseItems([...purchaseItems, { product_id: '', qty: 1, cost_price: 0 }]);
  };

  const updatePurchaseLine = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;

    if (field === 'product_id') {
      const prod = products.find(p => p.id === Number(value));
      if (prod) {
        updated[index].cost_price = prod.purchase_price;
      }
    }
    setPurchaseItems(updated);
  };

  const removePurchaseLine = (index) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) return alert('Select supplier');

    const validItems = purchaseItems.filter(i => i.product_id && Number(i.qty) > 0);
    if (validItems.length === 0) return alert('Add at least one valid product line');

    try {
      const payload = {
        supplier_id: Number(selectedSupplierId),
        invoice_number: vendorInvoiceNo,
        notes: purchaseNotes,
        items: validItems.map(i => ({
          product_id: Number(i.product_id),
          qty: Number(i.qty),
          cost_price: Number(i.cost_price)
        }))
      };

      await purchaseService.create(payload);
      setShowPurchaseModal(false);
      setSelectedSupplierId('');
      setVendorInvoiceNo('');
      setPurchaseItems([{ product_id: '', qty: 1, cost_price: 0 }]);
      fetchData();
      alert('Stock-In purchase entry recorded successfully! Product stock auto-incremented.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record purchase entry');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-500" />
            Supplier & Stock-In Purchases
          </h2>
          <p className="text-xs text-slate-400">Vendor directory, stock-in entry, cost price updates, and purchase history.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-slate-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>

          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-xs shadow-md transition"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Stock-In Purchase Entry</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Suppliers Cards | Right Recent Stock-In Purchase Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Suppliers List (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-base">Suppliers Directory ({suppliers.length})</h3>

          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading vendors...</div>
          ) : (
            <div className="space-y-3">
              {suppliers.map((s) => (
                <div key={s.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-100">{s.name}</h4>
                    <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      ID #{s.id}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    {s.contact_person && <div>Contact Person: <span className="text-slate-200 font-medium">{s.contact_person}</span></div>}
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{s.phone}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{s.email}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{s.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchase Orders (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-base">Recent Stock-In Purchases ({purchases.length})</h3>

          {purchases.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl py-12 text-center text-slate-500 text-xs">
              No purchase orders recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((pur) => (
                <div key={pur.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-100">{pur.supplier_name}</span>
                      <div className="text-[10px] text-slate-400 font-mono">Invoice #{pur.invoice_number || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-orange-400">₹ {pur.total_amount.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-500">{new Date(pur.date).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                    {pur.items.map((pi) => (
                      <div key={pi.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">{pi.product_name}</span>
                        <span className="text-slate-400 font-mono">{pi.qty} units @ ₹{pi.cost_price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-100 text-sm">Add New Supplier / Vendor</h3>
              <button onClick={() => setShowSupplierModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="Astral Pipes Ltd Distributor"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Contact Person</label>
                  <input
                    type="text"
                    value={supplierForm.contact_person}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                    placeholder="Ramesh Gupta"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="+91 98100 12345"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder="orders@astraldist.in"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Warehouse / Office Address</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Plot 45, Wazirpur Industrial Area, Delhi"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 text-white rounded font-semibold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock-In Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-orange-500" />
                Stock-In Purchase Entry
              </h3>
              <button onClick={() => setShowPurchaseModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Select Supplier *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Vendor Bill / Invoice #</label>
                  <input
                    type="text"
                    value={vendorInvoiceNo}
                    onChange={(e) => setVendorInvoiceNo(e.target.value)}
                    placeholder="e.g. AST-94812"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              {/* Purchase Items List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-300">Items Received</label>
                  <button
                    type="button"
                    onClick={addPurchaseLine}
                    className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Add Item Line
                  </button>
                </div>

                {purchaseItems.map((pi, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 items-center">
                    <div className="col-span-6">
                      <select
                        required
                        value={pi.product_id}
                        onChange={(e) => updatePurchaseLine(idx, 'product_id', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                      >
                        <option value="">Select Product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={pi.qty}
                        onChange={(e) => updatePurchaseLine(idx, 'qty', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Cost Price (₹)"
                        value={pi.cost_price}
                        onChange={(e) => updatePurchaseLine(idx, 'cost_price', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-right"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removePurchaseLine(idx)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 text-white rounded font-bold"
                >
                  Complete Stock-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
