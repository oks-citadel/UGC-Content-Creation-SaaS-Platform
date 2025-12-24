'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { OtpInput } from './OtpInput';

type MfaMethod = 'totp' | 'email' | 'recovery';

interface MfaVerificationProps {
  userId: string;
  availableMethods: string[];
  onVerify: (code: string, method: MfaMethod) => Promise<void>;
  onBack?: () => void;
  onResendEmail?: () => Promise<void>;
  className?: string;
}

export function MfaVerification({
  userId,
  availableMethods,
  onVerify,
  onBack,
  onResendEmail,
  className,
}: MfaVerificationProps) {
  const [method, setMethod] = useState<MfaMethod>(
    availableMethods.includes('totp') ? 'totp' : 'email'
  );
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleVerify = useCallback(async () => {
    if (!code || (method !== 'recovery' && code.length !== 6)) {
      setError('Please enter a valid code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onVerify(code, method);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  }, [code, method, onVerify]);

  const handleSendEmailOtp = useCallback(async () => {
    if (!onResendEmail || countdown > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      await onResendEmail();
      setEmailSent(true);
      setCountdown(60);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  }, [onResendEmail, countdown]);

  const handleMethodChange = useCallback((newMethod: MfaMethod) => {
    setMethod(newMethod);
    setCode('');
    setError(null);
    setEmailSent(false);
  }, []);

  const getMethodIcon = (m: MfaMethod) => {
    switch (m) {
      case 'totp':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      case 'email':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case 'recovery':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        );
    }
  };

  const getMethodLabel = (m: MfaMethod) => {
    switch (m) {
      case 'totp':
        return 'Authenticator App';
      case 'email':
        return 'Email Code';
      case 'recovery':
        return 'Recovery Code';
    }
  };

  const renderMethodInput = () => {
    switch (method) {
      case 'totp':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Enter the 6-digit code from your authenticator app
            </p>
            <OtpInput
              length={6}
              value={code}
              onChange={setCode}
              onComplete={handleVerify}
              error={!!error}
              type="numeric"
            />
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            {!emailSent ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We will send a verification code to your email address.
                </p>
                <button
                  onClick={handleSendEmailOtp}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Enter the 6-digit code sent to your email
                </p>
                <OtpInput
                  length={6}
                  value={code}
                  onChange={setCode}
                  onComplete={handleVerify}
                  error={!!error}
                  type="numeric"
                />
                <div className="text-center">
                  <button
                    onClick={handleSendEmailOtp}
                    disabled={countdown > 0}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case 'recovery':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Enter one of your recovery codes (format: XXXX-XXXX)
            </p>
            <OtpInput
              length={8}
              value={code.replace('-', '')}
              onChange={(val) => setCode(val.slice(0, 4) + (val.length > 4 ? '-' + val.slice(4) : ''))}
              error={!!error}
              type="alphanumeric"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              Note: Each recovery code can only be used once
            </p>
          </div>
        );
    }
  };

  return (
    <div className={clsx('max-w-md mx-auto', className)}>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 mb-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Two-Factor Authentication
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Verify your identity to continue
          </p>
        </div>

        {/* Method Selector */}
        {availableMethods.length > 1 && (
          <div className="flex gap-2 mb-6">
            {availableMethods.map((m) => (
              <button
                key={m}
                onClick={() => handleMethodChange(m as MfaMethod)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                  method === m
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                {getMethodIcon(m as MfaMethod)}
                <span className="hidden sm:inline">{getMethodLabel(m as MfaMethod)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Method-specific Input */}
        {renderMethodInput()}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
          )}
          {(method !== 'email' || emailSent) && (
            <button
              onClick={handleVerify}
              disabled={isLoading || !code || (method !== 'recovery' && code.length < 6)}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          )}
        </div>

        {/* Help Link */}
        <div className="mt-4 text-center">
          <a
            href="#"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Having trouble? Get help
          </a>
        </div>
      </div>
    </div>
  );
}

export default MfaVerification;
