import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wrench, User, LogOut, Database, ShieldCheck } from 'lucide-react';
import { seedService } from '../services/api';

export default function Navbar({ onSeedSuccess }) {
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
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-6 py-3.5 flex items-center justify-between shadow-md">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3">
        <div className="bg-orange-600/20 p-2 rounded-lg border border-orange-500/30 text-orange-500">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
            Apex Hardware & CRM
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">GST POS</span>
          </h1>
          <p className="text-xs text-slate-400">Plumbing Retail & Wholesale System</p>
        </div>
      </div>

      {/* Actions & User Badge */}
      <div className="flex items-center space-x-4">
        {/* Quick Demo Seed Button for Uncle Demo */}
        <button
          onClick={handleSeed}
          title="Load sample plumbing products, contractors & sales for demonstration"
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <Database className="w-3.5 h-3.5 text-orange-400" />
          <span>Load Demo Data</span>
        </button>

        {/* User Info */}
        <div className="flex items-center space-x-2.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700/60">
          <div className="bg-slate-700 p-1.5 rounded-full text-slate-300">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-200">{user?.full_name || user?.username}</div>
            <div className="text-[10px] text-orange-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" />
              {user?.role || 'Staff'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-md transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
}
