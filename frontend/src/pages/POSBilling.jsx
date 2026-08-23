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
  Package
} from 'lucide-react';

export default function POSBilling() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
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
    <div className="p-3 sm:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            Fast POS Billing Terminal
          </h2>
          <p className="text-xs text-slate-400">Quick barcode scan, instant GST tax calculation, cash & credit udhaar split.</p>
        </div>

        {/* Mobile View Toggle Buttons (< lg) */}
        <div className="flex lg:hidden bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              mobileTab === 'catalog'
                ? 'bg-orange-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catalog ({filteredProducts.length})</span>
          </button>

          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              mobileTab === 'cart'
                ? 'bg-orange-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Cart ({totalCartCount}) • ₹{grandTotal.toFixed(0)}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Grid Layout: Desktop Side-by-Side (7 cols catalog, 5 cols cart) | Mobile Toggle Views */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* LEFT COLUMN: Product Catalog */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'cart' ? 'hidden lg:block' : 'block'}`}>
          {/* Quick Barcode Scanner & Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
            <form onSubmit={handleBarcodeSubmit} className="sm:col-span-5 relative">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode / SKU..."
                className="w-full bg-slate-900 border border-orange-500/40 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
              />
              <Barcode className="w-4 h-4 text-orange-500 absolute left-3 top-2.5" />
            </form>

            <div className="sm:col-span-7 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or brand..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] sm:max-h-[520px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isOut = p.stock_qty <= 0;
              const isLow = p.stock_qty <= p.low_stock_threshold;
              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && addToCart(p)}
                  className={`bg-slate-900 border rounded-xl p-3 flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
                    isOut
                      ? 'opacity-40 border-slate-800 cursor-not-allowed'
                      : 'border-slate-800 hover:border-orange-500/50 hover:bg-slate-850'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {p.sku}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">{p.brand || p.category}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 line-clamp-2">{p.name}</div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                    <div className="text-sm font-bold text-orange-400">
                      ₹ {p.selling_price} <span className="text-[10px] text-slate-500 font-normal">/{p.unit}</span>
                    </div>
                    <div className="text-[11px] font-semibold">
                      {isOut ? (
                        <span className="text-red-400">Out of Stock</span>
                      ) : (
                        <span className={isLow ? 'text-amber-400' : 'text-slate-400'}>
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
            <div className="lg:hidden sticky bottom-2 bg-orange-600 text-white p-3 rounded-xl shadow-xl flex items-center justify-between z-20">
              <div>
                <div className="text-xs font-semibold">{totalCartCount} items selected</div>
                <div className="text-sm font-bold">Total: ₹ {grandTotal.toFixed(2)}</div>
              </div>
              <button
                onClick={() => setMobileTab('cart')}
                className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5"
              >
                <span>Proceed to Checkout</span>
                <ShoppingCart className="w-4 h-4 text-orange-400" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Cart & Checkout */}
        <div className={`lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm ${
          mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <ShoppingCart className="w-4 h-4 text-orange-500" />
              Current Sale Items ({totalCartCount})
            </h3>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-400 hover:underline font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2 pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p className="text-xs">No products selected. Click a product or scan barcode to add.</p>
              </div>
            ) : (
              cart.map((item) => {
                const itemTotal = (item.qty * item.unit_price) * (1 + item.gst_rate / 100.0);
                return (
                  <div key={item.product_id} className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between">
                    <div className="space-y-0.5 max-w-[150px] sm:max-w-[170px]">
                      <div className="text-xs font-bold text-slate-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ₹{item.unit_price} + {item.gst_rate}% GST
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-md">
                        <button
                          onClick={() => updateQty(item.product_id, item.qty - 1)}
                          className="px-1.5 py-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-100">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.product_id, item.qty + 1)}
                          className="px-1.5 py-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right w-16">
                        <div className="text-xs font-bold text-slate-100">₹{itemTotal.toFixed(2)}</div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Customer & Payment Config Section */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-3 text-xs">
            {/* Customer Select */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-orange-400" />
                Select Customer (Walk-in or Udhaar)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
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
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-orange-400" />
                Payment Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['Cash', 'Credit', 'UPI', 'Card'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentType(mode)}
                    className={`py-1.5 rounded text-[11px] font-bold transition border ${
                      paymentType === mode
                        ? mode === 'Credit'
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-orange-600 text-white border-orange-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
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
                <label className="block text-[10px] text-slate-400">Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder={paymentType === 'Credit' ? '0.00' : grandTotal.toFixed(2)}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Totals & Bill Button */}
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal:</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Total GST Tax:</span>
              <span>₹ {totalGst.toFixed(2)}</span>
            </div>
            {overallDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Discount:</span>
                <span>- ₹ {Number(overallDiscount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-100 pt-1 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="text-orange-400">₹ {grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className={`w-full py-3 rounded-lg text-sm font-bold text-white shadow-lg transition flex items-center justify-center space-x-2 ${
                isSubmitting || cart.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-orange-600 hover:bg-orange-500 shadow-orange-950/40'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing Invoice...' : 'Generate GST Invoice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Created Success Modal */}
      {createdInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-100">Invoice Created Successfully</h3>
              <p className="text-xs text-slate-400 font-mono">Invoice Number: {createdInvoice.invoice_no}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="text-slate-200 font-semibold">{createdInvoice.customer_name || 'Walk-in Retail'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="text-slate-200 font-semibold">{createdInvoice.payment_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount:</span>
                <span className="text-orange-400 font-bold">₹ {createdInvoice.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href={saleService.getPdfUrl(createdInvoice.id)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print GST Invoice (PDF)</span>
              </a>

              <button
                onClick={() => setCreatedInvoice(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
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
