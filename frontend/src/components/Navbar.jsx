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
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-md sticky top-0 z-30 w-full">
      {/* Left: Mobile Hamburger & Brand Title */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="bg-orange-600/20 p-1.5 sm:p-2 rounded-lg border border-orange-500/30 text-orange-500 shrink-0">
          <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div className="whitespace-nowrap">
          <h1 className="font-bold text-xs sm:text-base text-slate-100 tracking-tight flex items-center gap-1.5">
            <span>Apex Hardware</span>
            <span className="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">GST POS</span>
          </h1>
          <p className="text-[10px] text-slate-400 hidden md:block">Plumbing Retail & Wholesale System</p>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Demo Seed Button */}
        <button
          onClick={handleSeed}
          title="Load sample plumbing products, contractors & sales for demonstration"
          className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <Database className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="hidden sm:inline">Load Demo Data</span>
          <span className="sm:hidden text-[10px]">Demo</span>
        </button>

        {/* User Badge */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md border border-slate-700/60">
          <div className="bg-slate-700 p-1 rounded-full text-slate-300 shrink-0">
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-200">{user?.full_name || user?.username}</div>
            <div className="text-[10px] text-orange-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" />
              {user?.role || 'Staff'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Exit System"
          className="p-1.5 sm:px-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition flex items-center space-x-1"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline text-xs font-semibold">Exit</span>
        </button>
      </div>
    </header>
  );
}
