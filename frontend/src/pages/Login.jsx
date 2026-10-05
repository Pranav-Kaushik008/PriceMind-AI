import React, { useState } from 'react';
import {
  Zap, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle,
  TrendingUp, Brain, Target, BarChart3, ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';

const FEATURE_CARDS = [
  {
    icon: Brain,
    label: 'AI Forecasting',
    desc: 'Predict demand with 94.2% accuracy using ensemble ML models',
    color: 'from-indigo-500/20 to-indigo-500/5',
    border: 'border-indigo-500/25',
    iconColor: 'text-indigo-400',
  },
  {
    icon: Target,
    label: 'Price Optimization',
    desc: 'Real-time dynamic pricing across 50K+ SKUs simultaneously',
    color: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/25',
    iconColor: 'text-cyan-400',
  },
  {
    icon: TrendingUp,
    label: 'Elasticity Engine',
    desc: 'Log-log regression demand curves with confidence intervals',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/25',
    iconColor: 'text-emerald-400',
  },
  {
    icon: BarChart3,
    label: 'SHAP Explainability',
    desc: 'Every recommendation grounded with feature-level attribution',
    color: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/25',
    iconColor: 'text-purple-400',
  },
];

export function Login() {
  const { login, setAuthPage } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setForgotPasswordNotice(false);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient.login(email.trim(), password);
      if (data && data.access_token) {
        login(data.access_token, data.user);
      } else {
        setErrorMessage('Authentication response was invalid.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#060A12] text-white flex font-sans select-none overflow-hidden">

      {/* ─── LEFT: Branding & Feature Showcase ─── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden p-12 justify-between">
        {/* Ambient mesh glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[80px]" />
          <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-emerald-500/8 blur-[70px]" />
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.6)]">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-widest text-white font-mono uppercase">PriceMind</span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/40 font-bold uppercase tracking-wider">AI</span>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
              AI-Powered<br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Dynamic Pricing
              </span><br />
              Intelligence
            </h1>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-sm">
              Enterprise-grade pricing optimization, demand forecasting, and competitive intelligence for modern revenue teams.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={`relative p-3.5 rounded-xl bg-gradient-to-br ${card.color} border ${card.border} backdrop-blur-sm`}
                >
                  <div className={`flex items-center gap-2 mb-1.5`}>
                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                    <span className="text-xs font-semibold text-white">{card.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom trust bar */}
        <div className="relative z-10 flex items-center gap-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] text-emerald-400 font-medium">All Systems Operational</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-400 font-mono">v1.4.2 · Production</span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-400">AES-256 GCM Encrypted</span>
        </div>
      </div>

      {/* ─── RIGHT: Login Form Panel ─── */}
      <div className="flex flex-col w-full lg:w-[440px] xl:w-[480px] flex-shrink-0 relative">
        {/* Glass panel background */}
        <div className="absolute inset-0 bg-[#0A0F1A]/80 backdrop-blur-2xl border-l border-white/[0.08]" />

        {/* Ambient glow behind form */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-600/10 blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col flex-1 justify-center px-8 py-12 sm:px-12">

          {/* Mobile logo only */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="font-black text-sm tracking-widest text-white font-mono uppercase">PriceMind AI</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-400">Sign in to your pricing intelligence dashboard</p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Forgot Password Notice */}
          {forgotPasswordNotice && (
            <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <span>Password reset via email is disabled in this environment. Please contact your organization administrator or create a new account.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  placeholder="analyst@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={isLoading}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.07] hover:border-white/[0.16] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.07] hover:border-white/[0.16] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotPasswordNotice(true)}
                  className="text-[11px] text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-slate-500">New to PriceMind?</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Register CTA */}
          <button
            type="button"
            onClick={() => setAuthPage('signup')}
            className="w-full h-11 rounded-xl border border-white/[0.10] hover:border-indigo-500/40 bg-white/[0.03] hover:bg-white/[0.06] text-slate-200 text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer group"
          >
            <span>Create your organization</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          </button>

          {/* Security footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>AES-256 GCM · JWT Auth · Enterprise SSO Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
