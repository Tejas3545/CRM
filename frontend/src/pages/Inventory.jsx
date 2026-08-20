import React, { useState, useEffect } from 'react';
import { productService, supplierService } from '../services/api';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  SlidersHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Layers,
  X,
  Check
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjProduct, setAdjProduct] = useState(null);
  const [qtyChange, setQtyChange] = useState('');
  const [adjReason, setAdjReason] = useState('Correction');

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkProduct, setBulkProduct] = useState(null);
  const [bulkUnitName, setBulkUnitName] = useState('Bundle (100m)');
  const [bulkQtyConverted, setBulkQtyConverted] = useState(1);
  const [unitsPerBulk, setUnitsPerBulk] = useState(100);

  // Form State
  const initialForm = {
    sku: '',
    barcode: '',
    name: '',
    category: 'Pipes',
    brand: '',
    unit: 'piece',
    purchase_price: '',
    selling_price: '',
    gst_rate: 18.0,
    hsn_code: '3917',
    stock_qty: 0,
    low_stock_threshold: 10,
    supplier_id: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');

  const categories = [
    'All', 'Pipes', 'Fittings', 'Valves', 'Taps',
    'Cement/Adhesives', 'Sanitary Ware', 'Tools', 'Electricals', 'Misc'
  ];

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, lowStockOnly]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (lowStockOnly) params.low_stock_only = true;
      if (search) params.search = search;

      const [pRes, sRes] = await Promise.all([
        productService.list(params),
        supplierService.list()
      ]);

      setProducts(pRes.data);
      setSuppliers(sRes.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialForm);
    setFormError('');
    setShowProductModal(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      barcode: p.barcode || '',
      name: p.name,
      category: p.category,
      brand: p.brand || '',
      unit: p.unit,
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      gst_rate: p.gst_rate,
      hsn_code: p.hsn_code || '3917',
      stock_qty: p.stock_qty,
      low_stock_threshold: p.low_stock_threshold,
      supplier_id: p.supplier_id || ''
    });
    setFormError('');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      const payload = {
        ...formData,
        purchase_price: Number(formData.purchase_price),
        selling_price: Number(formData.selling_price),
        gst_rate: Number(formData.gst_rate),
        stock_qty: Number(formData.stock_qty),
        low_stock_threshold: Number(formData.low_stock_threshold),
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
      } else {
        await productService.create(payload);
      }

      setShowProductModal(false);
      fetchInventory();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.delete(id);
      fetchInventory();
    } catch (err) {
      alert('Cannot delete product connected to sales/purchases history.');
    }
  };

  // Stock Adjustment Submit
  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!qtyChange || Number(qtyChange) === 0) return;

    try {
      await productService.adjustStock({
        product_id: adjProduct.id,
        qty_change: Number(qtyChange),
        reason: adjReason
      });
      setShowAdjustmentModal(false);
      setAdjProduct(null);
      setQtyChange('');
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.detail || 'Stock adjustment failed');
    }
  };

  // Bulk Conversion Submit
  const handleBulkConvertSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.bulkConvert({
        product_id: bulkProduct.id,
        bulk_unit_name: bulkUnitName,
        quantity_converted: Number(bulkQtyConverted),
        units_per_bulk: Number(unitsPerBulk)
      });
      setShowBulkModal(false);
      setBulkProduct(null);
      fetchInventory();
    } catch (err) {
      alert('Bulk conversion failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-500" />
            Inventory & Stock Catalog
          </h2>
          <p className="text-xs text-slate-400">Pipes, fittings, valves, taps, cement, tools stock tracking and bulk unit conversion.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, SKU, or barcode..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </form>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                lowStockOnly
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alerts</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Cards Grid (Kanban Inspired Structural Columns) */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading catalog items...</div>
      ) : products.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-12 text-center text-slate-500 space-y-2">
          <Package className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
          <p className="text-xs">No products match your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const isLow = p.stock_qty <= p.low_stock_threshold;
            return (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between shadow-sm transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/50">
                      {p.sku}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {p.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{p.name}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Brand: {p.brand || 'Generic'}</span>
                      <span>•</span>
                      <span>GST: {p.gst_rate}%</span>
                      {p.hsn_code && <span>• HSN: {p.hsn_code}</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Purchase Cost:</span>
                    <span className="text-slate-300 font-mono">₹ {p.purchase_price}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Selling Price:</span>
                    <span className="text-orange-400 font-bold font-mono">₹ {p.selling_price} / {p.unit}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">Current Stock:</span>
                    <span className={`font-bold ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                      {p.stock_qty} {p.unit}s
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setAdjProduct(p);
                        setQtyChange('');
                        setShowAdjustmentModal(true);
                      }}
                      title="Adjust stock (Damage, Return, Correction)"
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 text-[11px]"
                    >
                      <RefreshCw className="w-3 h-3 text-orange-400" />
                      <span>Adjust</span>
                    </button>

                    {/* Bulk conversion helper (e.g. bundle to meters) */}
                    <button
                      onClick={() => {
                        setBulkProduct(p);
                        setShowBulkModal(true);
                      }}
                      title="Convert bulk purchase (e.g. Bundle to meters)"
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 text-[11px]"
                    >
                      <Layers className="w-3 h-3 text-blue-400" />
                      <span>Bulk Convert</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base">
                {editingProduct ? 'Edit Product Details' : 'Add New Hardware Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Product SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PIP-CPVC-075"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Barcode Number</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="89010010001"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Astral CPVC Pipe 3/4 inch (3 Meter)"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Astral"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  >
                    {['piece', 'meter', 'foot', 'kg', 'bag', 'box'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">GST Rate (%) *</label>
                  <select
                    value={formData.gst_rate}
                    onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  >
                    {[5, 12, 18, 28].map(r => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={formData.stock_qty}
                    onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Low Stock Alert Min</label>
                  <input
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Supplier Vendor</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  >
                    <option value="">None / Direct</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && adjProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-100 text-sm">Stock Adjustment Log</h3>
              <button onClick={() => setShowAdjustmentModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div className="font-bold text-slate-200">{adjProduct.name}</div>
              <div className="text-slate-400">Current Available Stock: <span className="text-orange-400 font-bold">{adjProduct.stock_qty} {adjProduct.unit}s</span></div>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Qty Change (+ for addition, - for damage/loss)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. -5 for damage, +10 for correction"
                  value={qtyChange}
                  onChange={(e) => setQtyChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Reason *</label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                >
                  <option value="Correction">Manual Count Correction</option>
                  <option value="Damage">Damage / Broken Goods</option>
                  <option value="Return">Customer Return to Stock</option>
                  <option value="Expiry">Expiry / Defective</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 text-white rounded font-semibold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Unit Conversion Modal */}
      {showBulkModal && bulkProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-100 text-sm">Bulk Purchase to Unit Sale Converter</h3>
              <button onClick={() => setShowBulkModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-200">{bulkProduct.name}</div>
              <div className="text-slate-400">Sold By: <span className="text-orange-400 font-bold">{bulkProduct.unit}</span></div>
            </div>

            <form onSubmit={handleBulkConvertSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Bulk Unit Description</label>
                <input
                  type="text"
                  required
                  value={bulkUnitName}
                  onChange={(e) => setBulkUnitName(e.target.value)}
                  placeholder="e.g. Bundle (100 meters)"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Bulk Qty Converted</label>
                  <input
                    type="number"
                    min="1"
                    value={bulkQtyConverted}
                    onChange={(e) => setBulkQtyConverted(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">{bulkProduct.unit}s per Bulk</label>
                  <input
                    type="number"
                    min="1"
                    value={unitsPerBulk}
                    onChange={(e) => setUnitsPerBulk(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-orange-950/30 border border-orange-900/50 p-2.5 rounded text-[11px] text-orange-300">
                Will add <span className="font-bold">{bulkQtyConverted * unitsPerBulk} {bulkProduct.unit}s</span> to inventory stock.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 text-white rounded font-semibold"
                >
                  Convert & Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
