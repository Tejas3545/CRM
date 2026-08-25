import React, { useState, useEffect, useRef } from 'react';
import { productService, customerService, saleService } from '../services/api';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  FileText,
  User,
  CreditCard,
  Barcode,
  X,
  Package,
  Palette
} from 'lucide-react';

export default function POSBilling() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Vyapar Theme color selection: 'red' | 'blue' | 'green' | 'orange' | 'purple'
  const [invoiceTheme, setInvoiceTheme] = useState('red');

  // Mobile Tab State: 'catalog' | 'cart'
  const [mobileTab, setMobileTab] = useState('catalog');

  // Cart state
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentType, setPaymentType] = useState('Cash'); // Cash, Credit, UPI, Card
  const [amountPaid, setAmountPaid] = useState('');
  const [overallDiscount, setOverallDiscount] = useState(0);

  // Success Modal
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const barcodeInputRef = useRef(null);

  const categories = [
    'All', 'Pipes', 'Fittings', 'Valves', 'Taps',
    'Cement/Adhesives', 'Sanitary Ware', 'Tools', 'Electricals', 'Misc'
  ];

  const themeColors = [
    { id: 'red', name: 'Vyapar Red', bg: 'bg-red-600', border: 'border-red-600' },
    { id: 'blue', name: 'Classic Blue', bg: 'bg-blue-600', border: 'border-blue-600' },
    { id: 'green', name: 'Emerald', bg: 'bg-emerald-600', border: 'border-emerald-600' },
    { id: 'orange', name: 'Amber Gold', bg: 'bg-orange-500', border: 'border-orange-500' },
    { id: 'purple', name: 'Royal Purple', bg: 'bg-purple-600', border: 'border-purple-600' },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        productService.list(),
        customerService.list()
      ]);
      setProducts(pRes.data);
      setCustomers(cRes.data);
    } catch (err) {
      console.error('Failed to load products/customers', err);
    }
  };

  // Quick Barcode/SKU scan handler
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const res = await productService.lookup(barcodeInput.trim());
      addToCart(res.data);
      setBarcodeInput('');
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(`Product code '${barcodeInput}' not found.`);
    }
  };

  const addToCart = (product) => {
    if (product.stock_qty <= 0) {
      setErrorMsg(`'${product.name}' is out of stock (Available: 0).`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock_qty) {
          setErrorMsg(`Cannot add more than available stock (${product.stock_qty} ${product.unit}).`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product_id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          unit: product.unit,
          stock_qty: product.stock_qty,
          unit_price: product.selling_price,
          gst_rate: product.gst_rate,
          hsn_code: product.hsn_code,
          qty: 1,
          discount: 0
        }
      ];
    });
    setErrorMsg('');
  };

  const updateQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const item = cart.find(i => i.product_id === productId);
    if (item && newQty > item.stock_qty) {
      setErrorMsg(`Requested quantity exceeds available stock (${item.stock_qty} ${item.unit}).`);
      return;
    }
    setErrorMsg('');
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, qty: newQty } : i));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let totalGst = 0;

    cart.forEach(item => {
      const base = (item.qty * item.unit_price) - item.discount;
      const gst = base * (item.gst_rate / 100.0);
      subtotal += base;
      totalGst += gst;
    });

    const grandTotal = Math.max(0, subtotal + totalGst - Number(overallDiscount));
    return { subtotal, totalGst, grandTotal };
  };

  const { subtotal, totalGst, grandTotal } = calculateTotals();
  const totalCartCount = cart.reduce((a, b) => a + b.qty, 0);

  // Handle Invoice Submit
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Cart is empty. Select products to generate invoice.');
      return;
    }

    if (paymentType === 'Credit' && !selectedCustomerId) {
      setErrorMsg('Credit (udhaar) sales require selecting a registered customer profile.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const itemsPayload = cart.map(item => ({
        product_id: item.product_id,
        qty: item.qty,
        unit_price: item.unit_price,
        discount: item.discount
      }));

      const payload = {
        customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
        payment_type: paymentType,
        amount_paid: amountPaid ? Number(amountPaid) : (paymentType === 'Credit' ? 0 : grandTotal),
        discount: Number(overallDiscount),
        items: itemsPayload
      };

      const res = await saleService.createInvoice(payload);
      setCreatedInvoice(res.data);
      
      // Reset POS Cart
      setCart([]);
      setSelectedCustomerId('');
      setAmountPaid('');
      setOverallDiscount(0);
      loadInitialData(); // Refresh product stock levels
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to complete sale transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="p-3.5 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-red-600" />
            Vyapar Fast POS Billing Terminal
          </h2>
          <p className="text-xs text-slate-500 font-medium">Instant barcode lookup, GST tax billing & Udhaar credit ledger entry.</p>
        </div>

        {/* Mobile View Toggle Buttons (< lg) */}
        <div className="flex lg:hidden bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
              mobileTab === 'catalog'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catalog ({filteredProducts.length})</span>
          </button>

          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
              mobileTab === 'cart'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Cart ({totalCartCount}) • ₹{grandTotal.toFixed(0)}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Grid Layout: Desktop Side-by-Side (7 cols catalog, 5 cols cart) | Mobile Toggle Views */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT COLUMN: Product Catalog */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'cart' ? 'hidden lg:block' : 'block'}`}>
          {/* Quick Barcode Scanner & Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <form onSubmit={handleBarcodeSubmit} className="sm:col-span-5 relative">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode / SKU..."
                className="w-full bg-white border border-red-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono shadow-xs font-semibold"
              />
              <Barcode className="w-4 h-4 text-red-600 absolute left-3 top-3" />
            </form>

            <div className="sm:col-span-7 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU or brand..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-2xs ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[460px] sm:max-h-[520px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isOut = p.stock_qty <= 0;
              const isLow = p.stock_qty <= p.low_stock_threshold;
              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && addToCart(p)}
                  className={`bg-white border rounded-2xl p-3.5 flex flex-col justify-between transition cursor-pointer shadow-xs hover:shadow-md ${
                    isOut
                      ? 'opacity-50 border-slate-200 cursor-not-allowed bg-slate-50'
                      : 'border-slate-200 hover:border-red-500/80 hover:bg-red-50/20'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {p.sku}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.brand || p.category}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-2">{p.name}</div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                    <div className="text-sm font-extrabold text-red-600">
                      ₹ {p.selling_price} <span className="text-[10px] text-slate-400 font-normal">/{p.unit}</span>
                    </div>
                    <div className="text-[11px] font-bold">
                      {isOut ? (
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Out of Stock</span>
                      ) : (
                        <span className={isLow ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md' : 'text-slate-500'}>
                          Stock: {p.stock_qty} {p.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Floating Mobile Checkout Bar (< lg) */}
          {cart.length > 0 && (
            <div className="lg:hidden sticky bottom-2 bg-gradient-to-r from-red-600 to-rose-600 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between z-20">
              <div>
                <div className="text-xs font-semibold">{totalCartCount} items selected</div>
                <div className="text-sm font-extrabold">Total: ₹ {grandTotal.toFixed(2)}</div>
              </div>
              <button
                onClick={() => setMobileTab('cart')}
                className="bg-white text-red-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
              >
                <span>Checkout Cart</span>
                <ShoppingCart className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Vyapar Cart & Billing Panel */}
        <div className={`lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xs ${
          mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Cart Header & Theme Selector */}
          <div className="space-y-3 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4 text-red-600" />
                Current Sale Items ({totalCartCount})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 hover:underline font-bold"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Vyapar Invoice Color Theme Picker */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5 text-[11px]">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                Invoice Theme:
              </span>
              <div className="flex items-center space-x-1.5">
                {themeColors.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setInvoiceTheme(t.id)}
                    title={t.name}
                    className={`w-5 h-5 rounded-full ${t.bg} border-2 transition ${
                      invoiceTheme === t.id ? 'border-slate-800 scale-110' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2 pr-1">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p className="text-xs font-medium">No products in cart. Select items from catalog.</p>
              </div>
            ) : (
              cart.map((item) => {
                const itemTotal = (item.qty * item.unit_price) * (1 + item.gst_rate / 100.0);
                return (
                  <div key={item.product_id} className="bg-slate-50/80 border border-slate-200/90 p-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="space-y-0.5 max-w-[140px] sm:max-w-[160px]">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ₹{item.unit_price} + {item.gst_rate}% GST
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-2xs">
                        <button
                          onClick={() => updateQty(item.product_id, item.qty - 1)}
                          className="px-1.5 py-1 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.product_id, item.qty + 1)}
                          className="px-1.5 py-1 text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right w-16">
                        <div className="text-xs font-bold text-slate-900">₹{itemTotal.toFixed(2)}</div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Customer & Payment Options Section */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 text-xs">
            {/* Customer Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-red-600" />
                Select Customer (Retail or Udhaar)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
              >
                <option value="">Walk-in Retail Buyer (Cash/Instant)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type}) {c.credit_balance > 0 ? `[Owes ₹${c.credit_balance}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-red-600" />
                Payment Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['Cash', 'Credit', 'UPI', 'Card'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentType(mode)}
                    className={`py-1.5 rounded-lg text-[11px] font-extrabold transition border ${
                      paymentType === mode
                        ? mode === 'Credit'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {mode === 'Credit' ? 'Udhaar' : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Overall Discount & Paid Input Fields */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600">Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder={paymentType === 'Credit' ? '0.00' : grandTotal.toFixed(2)}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Totals & Bill Button */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Subtotal:</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Total GST Tax:</span>
              <span>₹ {totalGst.toFixed(2)}</span>
            </div>
            {overallDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-bold">
                <span>Discount:</span>
                <span>- ₹ {Number(overallDiscount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-red-600">₹ {grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className={`w-full py-3 rounded-xl text-sm font-extrabold text-white shadow-md transition flex items-center justify-center space-x-2 ${
                isSubmitting || cart.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isSubmitting ? 'Generating Bill...' : 'Generate Vyapar GST Bill'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Created Success Modal */}
      {createdInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Vyapar Bill Generated!</h3>
              <p className="text-xs text-slate-500 font-mono font-bold">Invoice No: {createdInvoice.invoice_no}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="text-slate-900 font-bold">{createdInvoice.customer_name || 'Walk-in Retail'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="text-slate-900 font-bold">{createdInvoice.payment_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Bill Amount:</span>
                <span className="text-red-600 font-extrabold text-sm">₹ {createdInvoice.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href={saleService.getPdfUrl(createdInvoice.id)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print GST Invoice (PDF)</span>
              </a>

              <button
                onClick={() => setCreatedInvoice(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
