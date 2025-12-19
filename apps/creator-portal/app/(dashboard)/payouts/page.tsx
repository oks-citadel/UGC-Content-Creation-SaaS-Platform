'use client';

import { useState } from 'react';
import PayoutRequestForm from '@/components/earnings/PayoutRequestForm';
import { CreditCard, Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function PayoutsPage() {
  const [showRequestForm, setShowRequestForm] = useState(false);

  const payoutHistory = [
    {
      id: '1',
      amount: '$2,500',
      date: '2024-06-01',
      status: 'completed',
      method: 'Bank Transfer',
      reference: 'PAY-2024-001',
    },
    {
      id: '2',
      amount: '$3,200',
      date: '2024-05-15',
      status: 'completed',
      method: 'PayPal',
      reference: 'PAY-2024-002',
    },
    {
      id: '3',
      amount: '$1,800',
      date: '2024-05-01',
      status: 'processing',
      method: 'Bank Transfer',
      reference: 'PAY-2024-003',
    },
  ];

  const payoutMethods = [
    {
      id: '1',
      type: 'Bank Transfer',
      details: 'Account ending in 4532',
      isPrimary: true,
    },
    {
      id: '2',
      type: 'PayPal',
      details: 'john.creator@email.com',
      isPrimary: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Payouts
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your payout methods and history
          </p>
        </div>
        <button
          onClick={() => setShowRequestForm(true)}
          className="btn btn-primary self-start md:self-auto"
        >
          Request Payout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-2xl font-bold text-gray-900">$2,890</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Ready to withdraw</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">$1,200</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Processing payouts</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Payout</p>
              <p className="text-lg font-bold text-gray-900">June 30</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Scheduled date</p>
        </div>
      </div>

      {showRequestForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Request Payout</h2>
          <PayoutRequestForm onCancel={() => setShowRequestForm(false)} />
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Payout Methods</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            Add Method
          </button>
        </div>
        <div className="space-y-3">
          {payoutMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{method.type}</p>
                  <p className="text-sm text-gray-600">{method.details}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.isPrimary && (
                  <span className="badge badge-primary">Primary</span>
                )}
                <button className="text-sm text-gray-600 hover:text-gray-900">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Payout History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Reference
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Method
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((payout) => (
                <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {payout.reference}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                    {payout.amount}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {payout.method}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {payout.date}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge ${
                        payout.status === 'completed'
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {payout.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
