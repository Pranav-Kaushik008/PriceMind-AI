import React, { useState } from 'react';
import {
  Zap, Lock, Mail, User, Building2, Eye, EyeOff, ArrowRight,
  ShieldCheck, AlertCircle, ChevronLeft, Check
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';

const BENEFITS = [
  { icon: '⚡', text: 'Real-time AI pricing recommendations' },
  { icon: '📈', text: 'Demand forecasting across 50K+ SKUs' },
  { icon: '🧠', text: 'SHAP-explainable ML decisions' },
  { icon: '🛡️', text: 'Margin guardrails & competitor radar' },
];

const inputClass =
  'w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.07] hover:border-white/[0.16] transition-all disabled:opacity-50';

function Field({ label, icon: Icon, right, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-300">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        {props.children ? (
          props.children
        ) : (
          <input className={inputClass} {...props} />
        )}
        {right}
      </div>
    </div>
  );
}

export function Signup() {
  const { login, setAuthPage } = useAppStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthColors = ['', 'bg-red-500', 'bg-amber-400', 'bg-emerald-400'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !orgName.trim() || !password.trim()) {
      setErrorMessage('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient.register({
        full_name: fullName.trim(),
        email: email.trim(),
        organization_name: orgName.trim(),
        password,
        confirm_password: confirmPassword,
      });
      if (data && data.access_token) {
        login(data.access_token, data.user);
      } else {
        setErrorMessage('Registration succeeded but token was not returned.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#060A12] text-white flex font-sans select-none overflow-hidden">

      {/* ─── LEFT: Branding Panel ─── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden p-12 justify-between">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] left-[-5%] w-[450px] h-[450px] rounded-full bg-indigo-600/12 blur-[90px]" />
          <div className="absolute bottom-[5%] right-[-10%] w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[80px]" />
          <div className="absolute top-[50%] left-[30%] w-[250px] h-[250px] rounded-full bg-purple-500/8 blur-[60px]" />
        </div>
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

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3">Joining PriceMind AI</p>
            <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
              Set Up Your<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Pricing Command
              </span><br />
              Center
            </h1>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-xs">
              Create your enterprise tenant and start optimizing revenue with AI-powered dynamic pricing in minutes.
            </p>
          </div>

          {/* Benefits list */}
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-base flex-shrink-0">
                  {b.icon}
                </div>
                <span className="text-sm text-slate-200">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-amber-400 text-sm">★</span>
              ))}
              <span className="text-xs text-slate-400 ml-1">Enterprise Grade</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "PriceMind AI helped us achieve 23% revenue uplift within the first quarter."
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">— Global Retail, Fortune 500</p>
          </div>
        </div>

        {/* Bottom trust bar */}
        <div className="relative z-10 flex items-center gap-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] text-emerald-400 font-medium">SOC 2 Type II</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-400">ISO 27001 Ready</span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-400">GDPR Compliant</span>
        </div>
      </div>

      {/* ─── RIGHT: Registration Form Panel ─── */}
      <div className="flex flex-col w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[#0A0F1A]/80 backdrop-blur-2xl border-l border-white/[0.08]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-indigo-600/8 blur-[50px] pointer-events-none" />

        <div className="relative z-10 flex flex-col px-8 py-10 sm:px-12 min-h-full justify-center">

          {/* Mobile logo + back */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 fill-white" />
              </div>
              <span className="font-black text-xs tracking-widest text-white font-mono uppercase">PriceMind AI</span>
            </div>
          </div>

          {/* Back to login */}
          <button
            type="button"
            onClick={() => setAuthPage('login')}
            className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer mb-8 w-fit"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </button>

          {/* Header */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-400">Set up your organization's pricing workspace</p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="text" placeholder="Dr. Jordan Hayes" value={fullName}
                  onChange={(e) => setFullName(e.target.value)} required autoFocus disabled={isLoading}
                  className={inputClass} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="email" placeholder="jordan.hayes@enterprise.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required disabled={isLoading}
                  className={inputClass} />
              </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="text" placeholder="Global Industrial Dynamics Corp" value={orgName}
                  onChange={(e) => setOrgName(e.target.value)} required disabled={isLoading}
                  className={inputClass} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}
                  className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className={`h-1 flex-1 rounded-full transition-all ${passwordStrength >= s ? strengthColors[passwordStrength] : 'bg-white/[0.08]'}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-medium ${passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading}
                  className={`${inputClass} pr-10`} />
                {confirmPassword && password === confirmPassword && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Submit */}
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
                  <span>Create Organization & Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-slate-500">Already have an account?</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <button
            type="button"
            onClick={() => setAuthPage('login')}
            className="w-full h-10 rounded-xl border border-white/[0.10] hover:border-indigo-500/40 bg-white/[0.03] hover:bg-white/[0.06] text-slate-200 text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            Sign In to existing workspace
          </button>

          {/* Security footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Multi-Tenant Isolation · AES-256 GCM · ISO 27001 Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
