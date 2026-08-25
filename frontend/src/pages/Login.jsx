import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Lock, User, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemoAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  const fillQuickDemoStaff = () => {
    setUsername('cashier');
    setPassword('staff123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Wrench className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Apex Vyapar Billing</h1>
          <p className="text-xs text-slate-500 font-semibold">Plumbing Retail, Wholesale & Udhaar Ledger System</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl text-center font-bold shadow-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Username</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. admin)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-sm rounded-xl shadow-md transition"
          >
            {loading ? 'Authenticating...' : 'Sign In to Vyapar POS'}
          </button>
        </form>

        {/* Instant Demo Helper Pills */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            Instant Demo Credentials
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={fillQuickDemoAdmin}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              Fill Owner Login
            </button>
            <button
              onClick={fillQuickDemoStaff}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              Fill Cashier Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
