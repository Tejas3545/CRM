import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wrench, User, LogOut, Database, ShieldCheck, Menu, X } from 'lucide-react';
import { seedService } from '../services/api';

export default function Navbar({ onSeedSuccess, mobileMenuOpen, setMobileMenuOpen }) {
  const { user, logout } = useAuth();

  const handleSeed = async () => {
    try {
      await seedService.seed();
      if (onSeedSuccess) onSeedSuccess();
      alert('Sample hardware catalog, customers & sales data successfully loaded for demonstration!');
    } catch (err) {
      alert('Failed to seed data: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <header className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-md sticky top-0 z-30 w-full border-b border-red-700">
      {/* Left: Mobile Hamburger & Brand Title */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-1.5 text-red-100 hover:text-white hover:bg-red-700/80 rounded-lg transition"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="bg-white/15 p-1.5 sm:p-2 rounded-xl border border-white/20 text-white shadow-sm shrink-0">
          <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div className="whitespace-nowrap">
          <h1 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5 text-white">
            <span>Apex Hardware</span>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 uppercase tracking-wider">
              GST Vyapar POS
            </span>
          </h1>
          <p className="text-[10px] text-red-100 hidden md:block font-medium">Plumbing Retail, Wholesale & Udhaar Billing</p>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Demo Seed Button */}
        <button
          onClick={handleSeed}
          title="Load sample plumbing products, contractors & sales for demonstration"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-semibold rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/25 shadow-sm transition"
        >
          <Database className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
          <span className="hidden sm:inline">Load Demo Data</span>
          <span className="sm:hidden text-[10px]">Demo</span>
        </button>

        {/* User Badge */}
        <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-white/20">
          <div className="bg-white/20 p-1 rounded-full text-white shrink-0">
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-white leading-none">{user?.full_name || user?.username}</div>
            <div className="text-[10px] text-red-100 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-300" />
              {user?.role || 'Staff'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Exit System"
          className="p-1.5 sm:px-3 py-1.5 text-red-100 hover:text-white hover:bg-red-800/60 rounded-lg transition flex items-center space-x-1 font-semibold text-xs border border-transparent hover:border-red-500/40"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </header>
  );
}
