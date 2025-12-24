'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { clsx } from 'clsx';

interface RecoveryCodesProps {
  codes: string[];
  onDismiss?: () => void;
  showWarning?: boolean;
  className?: string;
}

export function RecoveryCodes({
  codes,
  onDismiss,
  showWarning = true,
  className,
}: RecoveryCodesProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const codesText = codes.join('\n');
      await navigator.clipboard.writeText(codesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy recovery codes:', err);
    }
  }, [codes]);

  const handleDownload = useCallback(() => {
    const codesText = [
      '# Recovery Codes for Your Account',
      '# Keep these codes in a safe place.',
      '# Each code can only be used once.',
      '',
      ...codes,
      '',
      `# Generated: ${new Date().toISOString()}`,
    ].join('\n');

    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [codes]);

  const handlePrint = useCallback(() => {
    const printContent = `
      <html>
        <head>
          <title>Recovery Codes</title>
          <style>
            body { font-family: monospace; padding: 40px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            .warning { color: #dc2626; margin-bottom: 20px; font-size: 14px; }
            .codes { font-size: 16px; line-height: 2; }
            .code { background: #f3f4f6; padding: 4px 8px; margin: 4px 0; display: inline-block; }
          </style>
        </head>
        <body>
          <h1>Recovery Codes</h1>
          <p class="warning">Keep these codes in a safe place. Each code can only be used once.</p>
          <div class="codes">
            ${codes.map(code => `<div class="code">${code}</div>`).join('')}
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            Generated: ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }, [codes]);

  return (
    <div className={clsx('rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      {showWarning && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex">
            <svg
              className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Save these recovery codes
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                These codes will only be shown once. Store them securely - you will need them if you
                lose access to your authenticator app.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        {codes.map((code, index) => (
          <div
            key={index}
            className="font-mono text-sm px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-center"
          >
            {code}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleCopy}
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy codes
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>
      </div>

      {onDismiss && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              I have saved my recovery codes in a secure location
            </span>
          </label>

          <button
            onClick={onDismiss}
            disabled={!confirmed}
            className={clsx(
              'mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors',
              confirmed
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            )}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default RecoveryCodes;
