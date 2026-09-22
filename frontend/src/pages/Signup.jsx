import React, { useState } from 'react';
import { Zap, Lock, Mail, User, Building2, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
    <div className="min-h-screen w-screen bg-pm-bg text-pm-text flex flex-col justify-center items-center p-4 font-sans select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md bg-pm-surface border border-pm-border rounded-lg shadow-xl p-6 sm:p-8 relative z-10 space-y-5">
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
            Create an enterprise tenant and pricing analytics workspace
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-pm-negativeBg border border-pm-negativeBorder rounded text-xs text-pm-negativeText flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            type="text"
            placeholder="Dr. Jordan Hayes"
            icon={User}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoFocus
            disabled={isLoading}
          />

          <Input
            label="Work Email"
            type="email"
            placeholder="jordan.hayes@enterprise.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            label="Organization Name"
            type="text"
            placeholder="Global Industrial Dynamics Corp"
            icon={Building2}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            disabled={isLoading}
          />

          <div className="relative">
            <Input
              label="Password (min 8 characters)"
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

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center text-xs font-semibold mt-2"
            loading={isLoading}
            icon={ArrowRight}
            iconPosition="right"
          >
            Create Organization & Workspace
          </Button>
        </form>

        {/* Link back to login */}
        <div className="pt-2 border-t border-pm-borderSubtle">
          <div className="text-[11px] text-pm-textDim text-center space-y-1">
            <span>Already registered? </span>
            <button
              type="button"
              onClick={() => setAuthPage('login')}
              className="text-pm-accent hover:underline font-medium cursor-pointer"
            >
              Sign In to existing workspace
            </button>
          </div>
        </div>

        {/* Enterprise Security Footer */}
        <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-pm-textDim font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-pm-positiveText" />
          <span>Multi-Tenant Encrypted Isolation • ISO 27001 Ready</span>
        </div>
      </div>
    </div>
  );
}

export default Signup;
