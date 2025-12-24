'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { OtpInput } from './OtpInput';
import { RecoveryCodes } from './RecoveryCodes';

type MfaSetupStep = 'intro' | 'qr-code' | 'verify' | 'recovery-codes' | 'complete';

interface MfaSetupData {
  qrCode: string;
  secret: string;
  otpAuthUrl: string;
}

interface MfaSetupWizardProps {
  onSetupComplete?: () => void;
  onCancel?: () => void;
  apiBaseUrl?: string;
  className?: string;
}

export function MfaSetupWizard({
  onSetupComplete,
  onCancel,
  apiBaseUrl = '/api/auth',
  className,
}: MfaSetupWizardProps) {
  const [step, setStep] = useState<MfaSetupStep>('intro');
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const handleStartSetup = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/mfa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to initialize MFA setup');
      }

      const data = await response.json();
      setSetupData(data.data);
      setStep('qr-code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  const handleVerify = useCallback(async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/mfa/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Invalid verification code');
      }

      const data = await response.json();
      setRecoveryCodes(data.data.recoveryCodes);
      setStep('recovery-codes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, verificationCode]);

  const handleComplete = useCallback(() => {
    setStep('complete');
    onSetupComplete?.();
  }, [onSetupComplete]);

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Enable Two-Factor Authentication
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add an extra layer of security to your account. You will need an authenticator app like
              Google Authenticator or Authy.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start text-left">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Protection against password theft</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Even if someone gets your password, they cannot access your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start text-left">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Time-based codes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Codes refresh every 30 seconds for maximum security.
                  </p>
                </div>
              </div>

              <div className="flex items-start text-left">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Recovery codes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Backup codes in case you lose access to your authenticator.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleStartSetup}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Starting...' : 'Get Started'}
              </button>
            </div>
          </div>
        );

      case 'qr-code':
        return (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Scan QR Code
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Open your authenticator app and scan this QR code to add your account.
            </p>

            {setupData && (
              <>
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setupData.qrCode}
                    alt="MFA QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="mb-6">
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
                  >
                    {showSecret ? 'Hide' : 'Show'} manual entry code
                  </button>
                  {showSecret && (
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        If you cannot scan the QR code, enter this key manually:
                      </p>
                      <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                        {setupData.secret}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('intro')}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('verify')}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Verify Setup
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Enter the 6-digit code from your authenticator app to confirm setup.
            </p>

            <div className="mb-6">
              <OtpInput
                length={6}
                value={verificationCode}
                onChange={setVerificationCode}
                onComplete={handleVerify}
                error={!!error}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('qr-code');
                  setError(null);
                  setVerificationCode('');
                }}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        );

      case 'recovery-codes':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Save Recovery Codes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              These codes can be used to access your account if you lose your authenticator device.
            </p>

            <RecoveryCodes codes={recoveryCodes} onDismiss={handleComplete} />
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              MFA Enabled!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Two-factor authentication has been successfully enabled for your account.
            </p>
            <button
              onClick={onSetupComplete}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Progress indicator
  const getStepNumber = () => {
    switch (step) {
      case 'intro':
        return 1;
      case 'qr-code':
        return 2;
      case 'verify':
        return 3;
      case 'recovery-codes':
        return 4;
      case 'complete':
        return 5;
      default:
        return 1;
    }
  };

  return (
    <div className={clsx('max-w-md mx-auto', className)}>
      {/* Progress Steps */}
      {step !== 'complete' && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Setup', 'Scan', 'Verify', 'Backup'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    getStepNumber() > index + 1
                      ? 'bg-indigo-600 text-white'
                      : getStepNumber() === index + 1
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                  )}
                >
                  {getStepNumber() > index + 1 ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div
                    className={clsx(
                      'w-12 h-1 mx-1',
                      getStepNumber() > index + 1
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 px-1">
            {['Setup', 'Scan', 'Verify', 'Backup'].map((label, index) => (
              <span
                key={label}
                className={clsx(
                  'text-xs',
                  getStepNumber() >= index + 1
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-600'
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        {renderStep()}
      </div>
    </div>
  );
}

export default MfaSetupWizard;
