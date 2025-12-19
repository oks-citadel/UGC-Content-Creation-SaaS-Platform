'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react';

export default function PayoutMethodsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank');

  const payoutMethods = [
    {
      id: '1',
      type: 'Bank Transfer',
      details: {
        accountName: 'John Creator',
        accountNumber: '**** **** 4532',
        bankName: 'Chase Bank',
        routingNumber: '****5678',
      },
      isPrimary: true,
    },
    {
      id: '2',
      type: 'PayPal',
      details: {
        email: 'john.creator@email.com',
      },
      isPrimary: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Payout Methods
        </h1>
        <p className="text-gray-600 mt-1">
          Manage how you receive payments
        </p>
      </div>

      <div className="space-y-4">
        {payoutMethods.map((method) => (
          <div key={method.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{method.type}</h3>
                    {method.isPrimary && (
                      <span className="badge badge-primary">Primary</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {method.type === 'Bank Transfer' && (
                      <>
                        <p><strong>Account Name:</strong> {method.details.accountName}</p>
                        <p><strong>Account Number:</strong> {method.details.accountNumber}</p>
                        <p><strong>Bank:</strong> {method.details.bankName}</p>
                        <p><strong>Routing:</strong> {method.details.routingNumber}</p>
                      </>
                    )}
                    {method.type === 'PayPal' && (
                      <p><strong>Email:</strong> {method.details.email}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.isPrimary && (
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    Set as Primary
                  </button>
                )}
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddForm ? (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Add Payout Method</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['bank', 'paypal', 'stripe'].map((type) => (
                <button
                  key={type}
                  onClick={() => setPaymentMethod(type)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    paymentMethod === type
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900 capitalize">{type}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {type === 'bank' && 'Direct bank transfer'}
                    {type === 'paypal' && 'PayPal account'}
                    {type === 'stripe' && 'Stripe Connect'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-4">
            {paymentMethod === 'bank' && (
              <>
                <div>
                  <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    id="accountName"
                    type="text"
                    className="input"
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      id="accountNumber"
                      type="text"
                      className="input"
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Routing Number
                    </label>
                    <input
                      id="routingNumber"
                      type="text"
                      className="input"
                      placeholder="987654321"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    id="bankName"
                    type="text"
                    className="input"
                    placeholder="Bank of America"
                  />
                </div>
              </>
            )}

            {paymentMethod === 'paypal' && (
              <div>
                <label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  PayPal Email
                </label>
                <input
                  id="paypalEmail"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
            )}

            {paymentMethod === 'stripe' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  You will be redirected to Stripe to connect your account securely.
                </p>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-600">
                Set as primary payout method
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn btn-primary">
                Add Method
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-outline w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add New Payout Method
        </button>
      )}

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Payouts are processed within 3-5 business days</li>
          <li>Minimum payout amount is $50</li>
          <li>Bank transfer fees may apply depending on your location</li>
          <li>Ensure all information is accurate to avoid payment delays</li>
        </ul>
      </div>
    </div>
  );
}
