import React, { useState } from 'react';
import { Zap, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
    <div className="min-h-screen w-screen bg-pm-bg text-pm-text flex flex-col justify-center items-center p-4 font-sans select-none">
      {/* Background Ambience / Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md bg-pm-surface border border-pm-border rounded-lg shadow-xl p-6 sm:p-8 relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-pm-accent flex items-center justify-center text-white shadow-md">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="font-bold text-lg tracking-wider text-pm-text font-mono">PRICEMIND</span>
            <span className="text-xs font-mono px-1.5 py-0.5 bg-pm-accentBg text-pm-accentText rounded border border-pm-accentBorder font-semibold">
              AI
            </span>
          </div>
          <p className="text-xs text-pm-textSecondary">
            Institutional Pricing Intelligence & Demand Optimization Engine
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-pm-negativeBg border border-pm-negativeBorder rounded text-xs text-pm-negativeText flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Forgot Password Notice */}
        {forgotPasswordNotice && (
          <div className="p-3 bg-pm-warningBg border border-pm-warningBorder rounded text-xs text-pm-warningText flex items-start gap-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-pm-warningText" />
            <span>
              Password reset via email is disabled in this environment. Please contact your organization administrator or create a new account.
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Work Email"
              type="email"
              placeholder="analyst@enterprise.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-7 text-pm-textDim hover:text-pm-text transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={() => setForgotPasswordNotice(true)}
                className="text-[11px] text-pm-textDim hover:text-pm-accent transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center text-xs font-semibold mt-2"
            loading={isLoading}
            icon={ArrowRight}
            iconPosition="right"
          >
            Sign In to Terminal
          </Button>
        </form>

        {/* Demo Credentials Quick-Fill Hint */}
        <div className="pt-2 border-t border-pm-borderSubtle">
          <div className="text-[11px] text-pm-textDim text-center space-y-1">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => setAuthPage('signup')}
              className="text-pm-accent hover:underline font-medium cursor-pointer"
            >
              Register your organization
            </button>
          </div>
        </div>

        {/* Enterprise Security Footer */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-pm-textDim font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-pm-positiveText" />
          <span>AES-256 GCM • JWT Token-Secured API</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
