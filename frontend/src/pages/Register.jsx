import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { getApiBaseUrl, getGoogleOAuthUrl } from '../utils/apiUrl.js';
import toast from 'react-hot-toast';
import AuthLayout, { AuthField, AuthPrimaryButton } from '../components/auth/AuthLayout.jsx';

export default function Register() {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invitedEmail = params.get('email') || '';
  const [form, setForm] = useState({
    name: '',
    email: invitedEmail,
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  if (!loading && isAuthenticated) {
    return <Navigate to={invitedEmail ? '/shared' : '/dashboard'} replace />;
  }

  const handleGoogleLogin = () => {
    window.location.href = getGoogleOAuthUrl();
  };

  const passwordChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };

  const validateFrontend = () => {
    const errors = {};
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      errors.name = 'Please enter a valid full name.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    } else if (/^[0-9\s]+$/.test(trimmedName) || /^[!@#$%^&*()_+=\-[\]{};:'",.<>/?\\]+$/.test(trimmedName) || !/[A-Za-z]/.test(trimmedName)) {
      errors.name = 'Please enter a valid full name with letters.';
    }

    if (!form.email.trim()) {
      errors.email = 'Please enter a valid email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (!Object.values(passwordChecks).every(Boolean)) {
      errors.password = 'Password must contain uppercase, lowercase, number and special character.';
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const clientErrors = validateFrontend();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      toast.success(invitedEmail ? 'Account created. Shared items are ready.' : 'Account created');
      navigate(invitedEmail ? '/shared' : '/dashboard');
    } catch (err) {
      const serverData = err.response?.data || err.data;
      if (serverData && serverData.errorCode === 'VALIDATION_ERROR' && serverData.data) {
        setFieldErrors(serverData.data);
      } else if (serverData && serverData.errorCode === 'DUPLICATE_EMAIL') {
        setFieldErrors({ email: 'An account with this email already exists.' });
        toast.error('An account with this email already exists.');
      } else {
        toast.error(err.message || 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      compactOnMobile
      title="Create account"
      subtitle={
        invitedEmail
          ? 'Sign up to open the shared file or folder'
          : 'Create your account to get started'
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField
          label="Full Name"
          type="text"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Your full name"
          error={fieldErrors.name}
        />
        <AuthField
          label="Email Address"
          type="email"
          required
          readOnly={Boolean(invitedEmail)}
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com"
          error={fieldErrors.email}
        />
        <AuthField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Password123!"
          error={fieldErrors.password}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />

        {/* Password Strength Checklist */}
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f7f8fa] p-3 text-xs text-[#6b7280] space-y-1 dark:border-[#253044] dark:bg-[#0b0f17] dark:text-[#9ca3af]">
          <p className="font-semibold text-[#111827] dark:text-[#f9fafb] mb-1">Password must contain:</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className={`flex items-center gap-1 ${passwordChecks.length ? 'text-[#16a34a] font-semibold' : ''}`}>
              {passwordChecks.length ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />} 8-100 characters
            </div>
            <div className={`flex items-center gap-1 ${passwordChecks.upper ? 'text-[#16a34a] font-semibold' : ''}`}>
              {passwordChecks.upper ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />} Uppercase letter
            </div>
            <div className={`flex items-center gap-1 ${passwordChecks.lower ? 'text-[#16a34a] font-semibold' : ''}`}>
              {passwordChecks.lower ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />} Lowercase letter
            </div>
            <div className={`flex items-center gap-1 ${passwordChecks.number ? 'text-[#16a34a] font-semibold' : ''}`}>
              {passwordChecks.number ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />} Number
            </div>
            <div className={`flex items-center gap-1 ${passwordChecks.special ? 'text-[#16a34a] font-semibold' : ''}`}>
              {passwordChecks.special ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />} Special character
            </div>
          </div>
        </div>

        <AuthField
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          placeholder="Repeat password"
          error={fieldErrors.confirmPassword}
        />

        <div className="pt-2 space-y-3">
          <AuthPrimaryButton disabled={submitting}>
            {submitting ? 'Creating Account...' : 'Sign Up'}
          </AuthPrimaryButton>

          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-[#e5e7eb] dark:border-[#253044]"></div>
            <span className="absolute bg-white dark:bg-[#111827] px-3 text-[11px] font-semibold text-[#9ca3af] dark:text-[#6b7280]">
              OR
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-white py-2.5 text-xs font-semibold text-[#111827] shadow-xs transition hover:bg-[#f7f8fa] dark:border-[#253044] dark:bg-[#0b0f17] dark:text-[#f9fafb] dark:hover:bg-[#151c29] cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="pt-2 text-center text-xs text-[#6b7280] dark:text-[#9ca3af] sm:text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#3157d5] underline-offset-2 hover:text-[#2649bd] hover:underline focus:outline-none focus:ring-2 focus:ring-[#3157d5]/20 rounded-xs dark:text-[#5b7cff] dark:hover:text-[#7895ff]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
