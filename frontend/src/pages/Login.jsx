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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-orange-600/20 text-orange-500 rounded-xl flex items-center justify-center mx-auto border border-orange-500/30">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Apex Hardware & CRM</h1>
          <p className="text-xs text-slate-400">Plumbing Retail, Wholesale & Udhaar Ledger System</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Username</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. admin)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-sm transition shadow-lg shadow-orange-950/50"
          >
            {loading ? 'Authenticating...' : 'Sign In to POS'}
          </button>
        </form>

        {/* Quick Fill Buttons for Uncle Demo */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-center">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            <span>Instant Login Credentials for Demo</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fillQuickDemoAdmin}
              className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded border border-slate-700"
            >
              Fill Owner Login
            </button>
            <button
              onClick={fillQuickDemoStaff}
              className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded border border-slate-700"
            >
              Fill Cashier Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
