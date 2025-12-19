import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary-600">NEXUS</h1>
            <p className="text-gray-600 mt-2">Creator Portal</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
