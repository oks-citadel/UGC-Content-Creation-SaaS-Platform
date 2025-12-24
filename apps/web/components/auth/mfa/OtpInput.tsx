'use client';

import * as React from 'react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface OtpInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  type?: 'numeric' | 'alphanumeric';
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export function OtpInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  type = 'numeric',
  placeholder = '',
  error = false,
  className,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(
    value.split('').concat(Array(length - value.length).fill(''))
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update internal state when value prop changes
  useEffect(() => {
    const newOtp = value.split('').concat(Array(length - value.length).fill(''));
    setOtp(newOtp.slice(0, length));
  }, [value, length]);

  // Focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length && inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    }
  }, [length]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const input = e.target.value;
      const pattern = type === 'numeric' ? /^\d*$/ : /^[a-zA-Z0-9]*$/;

      // Handle paste
      if (input.length > 1) {
        const pastedValue = input.slice(0, length - index);
        if (pattern.test(pastedValue)) {
          const newOtp = [...otp];
          for (let i = 0; i < pastedValue.length && index + i < length; i++) {
            newOtp[index + i] = pastedValue[i].toUpperCase();
          }
          setOtp(newOtp);
          const otpString = newOtp.join('');
          onChange?.(otpString);

          // Focus next empty input or last filled
          const nextIndex = Math.min(index + pastedValue.length, length - 1);
          focusInput(nextIndex);

          if (newOtp.every(digit => digit !== '')) {
            onComplete?.(otpString);
          }
        }
        return;
      }

      // Single character input
      if (pattern.test(input)) {
        const newOtp = [...otp];
        newOtp[index] = input.toUpperCase();
        setOtp(newOtp);
        const otpString = newOtp.join('');
        onChange?.(otpString);

        // Move to next input
        if (input && index < length - 1) {
          focusInput(index + 1);
        }

        // Check if complete
        if (newOtp.every(digit => digit !== '')) {
          onComplete?.(otpString);
        }
      }
    },
    [otp, onChange, onComplete, focusInput, length, type]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      switch (e.key) {
        case 'Backspace':
          e.preventDefault();
          const newOtp = [...otp];
          if (otp[index]) {
            // Clear current input
            newOtp[index] = '';
            setOtp(newOtp);
            onChange?.(newOtp.join(''));
          } else if (index > 0) {
            // Move to previous and clear
            newOtp[index - 1] = '';
            setOtp(newOtp);
            onChange?.(newOtp.join(''));
            focusInput(index - 1);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          focusInput(index - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          focusInput(index + 1);
          break;
        case 'Delete':
          e.preventDefault();
          const deletedOtp = [...otp];
          deletedOtp[index] = '';
          setOtp(deletedOtp);
          onChange?.(deletedOtp.join(''));
          break;
      }
    },
    [otp, onChange, focusInput]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').trim();
      const pattern = type === 'numeric' ? /^\d+$/ : /^[a-zA-Z0-9]+$/;

      if (pattern.test(pastedData)) {
        const pastedValue = pastedData.slice(0, length);
        const newOtp = pastedValue
          .toUpperCase()
          .split('')
          .concat(Array(length - pastedValue.length).fill(''));
        setOtp(newOtp);
        const otpString = newOtp.join('');
        onChange?.(otpString);

        // Focus last filled or first empty
        const lastFilledIndex = Math.min(pastedValue.length - 1, length - 1);
        focusInput(lastFilledIndex);

        if (newOtp.every(digit => digit !== '')) {
          onComplete?.(otpString);
        }
      }
    },
    [onChange, onComplete, focusInput, length, type]
  );

  return (
    <div className={clsx('flex gap-2 justify-center', className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode={type === 'numeric' ? 'numeric' : 'text'}
          maxLength={1}
          value={digit}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={clsx(
            'w-12 h-14 text-center text-xl font-semibold rounded-lg border-2 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500',
            disabled
              ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
              : 'bg-white dark:bg-gray-900',
            'text-gray-900 dark:text-white'
          )}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}

export default OtpInput;
