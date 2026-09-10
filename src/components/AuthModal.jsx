import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { loginUser, guestLogin } from '../services/authService';

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    const user = loginUser(email, password);
    onSuccess(user);
    onClose();
  };

  const handleGuest = () => {
    const user = guestLogin();
    onSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-xl bg-[#0f1115] border border-zinc-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6 text-left">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-3">
            <span className="font-bold text-sm">A</span>
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            {isLogin ? 'Welcome back to AetherCraft' : 'Create your AetherCraft account'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Access the studio, manage projects, and deploy software.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg mb-4 text-xs bg-rose-950/40 border border-rose-900/60 text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mb-4 text-left">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-tight transition mt-2 shadow-sm"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
          <span className="relative px-2 bg-[#0f1115] text-[11px] text-zinc-500 uppercase tracking-wider">Or</span>
        </div>

        <button
          onClick={handleGuest}
          className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Continue as Guest Founder</span>
        </button>

        <div className="mt-5 text-center text-xs text-zinc-500">
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className="text-white hover:underline font-medium"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className="text-white hover:underline font-medium"
              >
                Log in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
