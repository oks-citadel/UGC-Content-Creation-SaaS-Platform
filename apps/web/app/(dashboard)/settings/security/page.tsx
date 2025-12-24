'use client';

import { useState, useEffect, useCallback } from 'react';
import { MfaSetupWizard, RecoveryCodes } from '@/components/auth/mfa';
import { clsx } from 'clsx';

interface MfaStatus {
  mfaEnabled: boolean;
  totpEnabled: boolean;
  emailOtpEnabled: boolean;
  preferredMethod: string | null;
  recoveryCodesRemaining: number;
}

export default function SecuritySettingsPage() {
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMfaStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/mfa/status', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMfaStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch MFA status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMfaStatus();
  }, [fetchMfaStatus]);

  const handleSetupComplete = useCallback(() => {
    setShowSetup(false);
    fetchMfaStatus();
  }, [fetchMfaStatus]);

  const handleDisableMfa = useCallback(async () => {
    if (!disableCode) {
      setError('Please enter your verification code');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: disableCode, method: 'totp' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to disable MFA');
      }

      setShowDisableModal(false);
      setDisableCode('');
      fetchMfaStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  }, [disableCode, fetchMfaStatus]);

  const handleRegenerateCodes = useCallback(async () => {
    if (!regenerateCode) {
      setError('Please enter your verification code');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/mfa/recovery-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: regenerateCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to regenerate codes');
      }

      const data = await response.json();
      setNewRecoveryCodes(data.data.recoveryCodes);
      setRegenerateCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  }, [regenerateCode]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/4"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <button
          onClick={() => setShowSetup(false)}
          className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Security Settings
        </button>
        <MfaSetupWizard
          onSetupComplete={handleSetupComplete}
          onCancel={() => setShowSetup(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mr-4">
                <svg
                  className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
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
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add an extra layer of security to your account by requiring a verification code in
                  addition to your password.
                </p>
              </div>
            </div>
            <div
              className={clsx(
                'px-3 py-1 rounded-full text-sm font-medium',
                mfaStatus?.mfaEnabled
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              )}
            >
              {mfaStatus?.mfaEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        {mfaStatus?.mfaEnabled ? (
          <>
            {/* Enabled MFA Details */}
            <div className="p-6 space-y-4">
              {/* Authentication Methods */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Authentication Methods
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Authenticator App</span>
                    </div>
                    <span
                      className={clsx(
                        'text-sm',
                        mfaStatus.totpEnabled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-500'
                      )}
                    >
                      {mfaStatus.totpEnabled ? 'Active' : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Email OTP</span>
                    </div>
                    <span
                      className={clsx(
                        'text-sm',
                        mfaStatus.emailOtpEnabled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-500'
                      )}
                    >
                      {mfaStatus.emailOtpEnabled ? 'Active' : 'Not configured'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recovery Codes */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Recovery Codes
                </h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {mfaStatus.recoveryCodesRemaining} of 10 codes remaining
                    </span>
                  </div>
                  <button
                    onClick={() => setShowRegenerateModal(true)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Regenerate
                  </button>
                </div>
                {mfaStatus.recoveryCodesRemaining <= 2 && (
                  <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                    You have few recovery codes remaining. Consider generating new ones.
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDisableModal(true)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Disable Two-Factor Authentication
              </button>
            </div>
          </>
        ) : (
          /* Not Enabled */
          <div className="p-6">
            <button
              onClick={() => setShowSetup(true)}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Enable Two-Factor Authentication
            </button>
          </div>
        )}
      </div>

      {/* Disable MFA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Disable Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will make your account less secure. Enter your authenticator code to confirm.
            </p>
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setDisableCode('');
                  setError(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableMfa}
                disabled={actionLoading}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Disabling...' : 'Disable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Codes Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            {newRecoveryCodes ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  New Recovery Codes
                </h3>
                <RecoveryCodes
                  codes={newRecoveryCodes}
                  onDismiss={() => {
                    setShowRegenerateModal(false);
                    setNewRecoveryCodes(null);
                    fetchMfaStatus();
                  }}
                />
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Regenerate Recovery Codes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  This will invalidate all existing recovery codes. Enter your authenticator code to
                  confirm.
                </p>
                <input
                  type="text"
                  value={regenerateCode}
                  onChange={(e) => setRegenerateCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
                />
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRegenerateModal(false);
                      setRegenerateCode('');
                      setError(null);
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegenerateCodes}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
