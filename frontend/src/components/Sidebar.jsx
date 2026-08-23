import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  BarChart3,
  X
} from 'lucide-react';

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'POS Billing', icon: ShoppingCart, highlight: true },
    { to: '/inventory', label: 'Inventory Stock', icon: Package },
    { to: '/crm', label: 'CRM & Udhaar', icon: Users },
    { to: '/suppliers', label: 'Suppliers & Purchases', icon: Truck },
    { to: '/reports', label: 'Business Reports', icon: BarChart3 },
  ];

  const handleNavClick = () => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const renderNavContent = () => (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-1">
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between px-3 py-2 lg:hidden border-b border-slate-800 mb-2">
          <span className="text-xs font-bold text-slate-300">Navigation Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          Hardware Modules
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
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                    : item.highlight
                    ? 'bg-slate-800/90 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Icon className={`w-4 h-4 ${item.highlight ? 'text-orange-500' : ''}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Hardware Shop Note Footer */}
      <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1 mt-6">
        <div className="font-semibold text-slate-300 flex items-center justify-between">
          <span>Plumbing POS</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="text-[11px] text-slate-400">Offline-ready database & instant GST calculation active.</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR: Renders strictly on desktop screens (>= lg) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col min-h-[calc(100vh-61px)] shrink-0">
        {renderNavContent()}
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY: Renders strictly on mobile screens (< lg) when opened */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Sidebar */}
          <div className="relative w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
}
