'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, AlertCircle } from 'lucide-react';

interface MFAStep {
  code: string;
  error?: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const [mfa, setMfa] = useState<MFAStep>({
    code: '',
  });

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // If MFA is required, move to MFA step
      if (data.mfaRequired) {
        setStep('mfa');
      } else {
        // Shouldn't happen for admin - MFA is always required
        router.push(redirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          code: mfa.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'MFA verification failed');
      }

      // Login successful
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">NEXUS Admin</h1>
        <p className="text-sm text-gray-600 mt-2">
          {step === 'credentials' ? 'Sign in to your admin account' : 'Enter your MFA code'}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Credentials Form */}
      {step === 'credentials' && (
        <form onSubmit={handleCredentialsSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@nexus.com"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      )}

      {/* MFA Form */}
      {step === 'mfa' && (
        <form onSubmit={handleMFASubmit} className="space-y-6">
          <div>
            <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Code
            </label>
            <input
              id="mfa-code"
              type="text"
              required
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              value={mfa.code}
              onChange={(e) => setMfa({ ...mfa, code: e.target.value.replace(/\D/g, '') })}
            />
            <p className="mt-2 text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setMfa({ code: '' });
                setError('');
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || mfa.code.length !== 6}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      )}

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">
          <strong>Security Notice:</strong> All admin actions are logged and monitored.
          Unauthorized access attempts will be reported.
        </p>
      </div>
    </>
  );
}

function LoginFormFallback() {
  return (
    <div className="animate-pulse">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4" />
        <div className="h-8 bg-gray-200 rounded w-40 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 rounded w-52 mx-auto" />
      </div>
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          NEXUS Platform Admin Dashboard &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
