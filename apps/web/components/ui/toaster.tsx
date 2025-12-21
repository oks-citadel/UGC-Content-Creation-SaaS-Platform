'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { clsx } from 'clsx';

const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = ToastPrimitives.Viewport;

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & ToastProps
>(({ className, title, description, variant = 'default', ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={clsx(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        variant === 'destructive'
          ? 'border-red-500 bg-red-500 text-white'
          : 'border-gray-200 bg-white',
        className
      )}
      {...props}
    >
      <div className="grid gap-1">
        {title && (
          <ToastPrimitives.Title className="text-sm font-semibold">
            {title}
          </ToastPrimitives.Title>
        )}
        {description && (
          <ToastPrimitives.Description className="text-sm opacity-90">
            {description}
          </ToastPrimitives.Description>
        )}
      </div>
      <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="sr-only">Close</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = 'Toast';

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:bottom-0 sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  );
}

export { Toast, ToastProvider, ToastViewport };
