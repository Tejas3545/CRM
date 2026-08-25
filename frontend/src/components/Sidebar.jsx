import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  BarChart3,
  X,
  Store
} from 'lucide-react';

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'POS Billing', icon: ShoppingCart, highlight: true },
    { to: '/inventory', label: 'Stock Items', icon: Package },
    { to: '/crm', label: 'Customers & Kanban', icon: Users },
    { to: '/suppliers', label: 'Suppliers & Purchases', icon: Truck },
    { to: '/reports', label: 'GST Reports', icon: BarChart3 },
  ];

  const handleNavClick = () => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const renderNavContent = () => (
    <div className="flex flex-col justify-between h-full p-3.5 sm:p-4">
      <div className="space-y-1.5">
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between px-3 py-2 lg:hidden border-b border-slate-100 mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vyapar Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-1.5 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center justify-between">
          <span>Modules</span>
          <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">Active</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-red-50 text-red-600 border-l-4 border-red-600 shadow-xs'
                    : item.highlight
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm hover:opacity-95'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? 'text-white' : ''}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Vyapar Hardware Shop Note Footer */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1 mt-6 shadow-xs">
        <div className="font-bold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs">
            <Store className="w-3.5 h-3.5 text-red-600" />
            Vyapar Billing
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">Offline-ready database & instant GST tax calculation active.</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR: Renders strictly on desktop screens (>= lg) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/90 flex-col min-h-[calc(100vh-61px)] shrink-0 shadow-xs">
        {renderNavContent()}
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY: Renders strictly on mobile screens (< lg) when opened */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Sidebar */}
          <div className="relative w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
}
