import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Layers,
  Edit2,
  X,
  TrendingUp,
  Sliders,
  CheckCircle
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState('All');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Pipes',
    brand: '',
    unit: 'piece',
    purchase_price: '',
    selling_price: '',
    gst_rate: 18.0,
    hsn_code: '',
    stock_qty: 0,
    low_stock_threshold: 10,
    barcode: ''
  });

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    quantity_change: 0,
    reason: 'Purchase Restock',
    notes: ''
  });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const categories = [
    'All', 'Pipes', 'Fittings', 'Valves', 'Taps',
    'Cement/Adhesives', 'Sanitary Ware', 'Tools', 'Electricals', 'Misc'
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.list();
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, productForm);
      } else {
        await productService.create(productForm);
      }
      setShowProductModal(false);
      resetProductForm();
      loadProducts();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save product details.');
    }
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    try {
      await productService.adjustStock(adjustProduct.id, {
        quantity_change: Number(adjustForm.quantity_change),
        reason: adjustForm.reason,
        notes: adjustForm.notes
      });
      setShowAdjustModal(false);
      loadProducts();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to adjust stock.');
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: 'Pipes',
      brand: '',
      unit: 'piece',
      purchase_price: '',
      selling_price: '',
      gst_rate: 18.0,
      hsn_code: '',
      stock_qty: 0,
      low_stock_threshold: 10,
      barcode: ''
    });
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      brand: p.brand || '',
      unit: p.unit,
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      gst_rate: p.gst_rate,
      hsn_code: p.hsn_code || '',
      stock_qty: p.stock_qty,
      low_stock_threshold: p.low_stock_threshold,
      barcode: p.barcode || ''
    });
    setShowProductModal(true);
  };

  const openAdjustModal = (p) => {
    setAdjustProduct(p);
    setAdjustForm({ quantity_change: 0, reason: 'Purchase Restock', notes: '' });
    setShowAdjustModal(true);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStock = true;
    if (selectedStockFilter === 'Low') matchesStock = p.stock_qty > 0 && p.stock_qty <= p.low_stock_threshold;
    if (selectedStockFilter === 'Out') matchesStock = p.stock_qty <= 0;

    return matchesCat && matchesQuery && matchesStock;
  });

  return (
    <div className="p-3.5 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-red-600" />
            Vyapar Inventory & Stock Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">Plumbing hardware catalog, stock count adjustment & low stock alerts.</p>
        </div>

        <button
          onClick={() => {
            resetProductForm();
            setShowProductModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Stock Item</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter & Search Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, SKU or brand..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['All', 'Low', 'Out'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStockFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs whitespace-nowrap ${
                selectedStockFilter === st
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? 'All Stock' : st === 'Low' ? '⚠️ Low Stock' : '❌ Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-2xs ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock Items Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">SKU / Item Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Purchase (₹)</th>
                <th className="p-3.5">Selling (₹)</th>
                <th className="p-3.5">GST Rate</th>
                <th className="p-3.5">Stock Level</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isOut = p.stock_qty <= 0;
                const isLow = p.stock_qty <= p.low_stock_threshold;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900 text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-bold">
                        SKU: {p.sku} {p.brand ? `• ${p.brand}` : ''}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-600">₹ {p.purchase_price.toFixed(2)}</td>
                    <td className="p-3.5 font-extrabold text-slate-900">₹ {p.selling_price.toFixed(2)}</td>
                    <td className="p-3.5 font-mono text-slate-500">{p.gst_rate}%</td>
                    <td className="p-3.5">
                      {isOut ? (
                        <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded font-extrabold text-[10px]">
                          Out of Stock
                        </span>
                      ) : (
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.stock_qty} {p.unit}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => openAdjustModal(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                      >
                        Adjust Stock
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg border border-red-200"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingProduct ? 'Edit Stock Item' : 'Add New Plumbing Hardware Item'}
              </h3>
              <button onClick={() => setShowProductModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. CPVC Pipe 1 inch x 10ft"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="e.g. PIPE-CPVC-1IN"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="e.g. Astral / Supreme"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unit of Measure</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="piece">piece</option>
                    <option value="length">length</option>
                    <option value="meter">meter</option>
                    <option value="foot">foot</option>
                    <option value="kg">kg</option>
                    <option value="bag">bag</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.purchase_price}
                    onChange={(e) => setProductForm({ ...productForm, purchase_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.selling_price}
                    onChange={(e) => setProductForm({ ...productForm, selling_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">GST Tax Rate (%)</label>
                  <select
                    value={productForm.gst_rate}
                    onChange={(e) => setProductForm({ ...productForm, gst_rate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% Standard GST</option>
                    <option value="28">28% Luxury GST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Opening Stock Qty</label>
                  <input
                    type="number"
                    value={productForm.stock_qty}
                    onChange={(e) => setProductForm({ ...productForm, stock_qty: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Low Stock Alert Level</label>
                  <input
                    type="number"
                    value={productForm.low_stock_threshold}
                    onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && adjustProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Adjust Item Stock Count</h3>
              <button onClick={() => setShowAdjustModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-slate-200">
              <div className="font-extrabold text-slate-900">{adjustProduct.name}</div>
              <div className="text-slate-600 font-semibold">
                Current Stock: <span className="font-bold text-slate-900">{adjustProduct.stock_qty} {adjustProduct.unit}</span>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Quantity Adjustment (+ Add / - Deduct)
                </label>
                <input
                  type="number"
                  required
                  value={adjustForm.quantity_change}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity_change: e.target.value })}
                  placeholder="e.g. +50 or -5"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Adjustment</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Purchase Restock">Purchase Restock</option>
                  <option value="Physical Count Correction">Physical Count Correction</option>
                  <option value="Damaged / Broken Goods">Damaged / Broken Goods</option>
                  <option value="Supplier Return">Supplier Return</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
