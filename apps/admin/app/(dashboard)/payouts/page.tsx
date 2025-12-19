'use client';

import { formatCurrency, formatDate } from '@/lib/utils';

export default function PayoutsPage() {
  const payouts = [
    { id: '1', creator: 'Sarah Johnson', amount: 2450, status: 'completed', date: '2024-03-15' },
    { id: '2', creator: 'Mike Chen', amount: 1850, status: 'processing', date: '2024-03-14' },
    { id: '3', creator: 'Emma Davis', amount: 3200, status: 'pending', date: '2024-03-13' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Creator Payouts</h1>
        <p className="text-gray-600 mt-2">Manage creator earnings and payouts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Paid Out', value: formatCurrency(245000) },
          { label: 'Pending Payouts', value: formatCurrency(18500) },
          { label: 'Processing', value: formatCurrency(12300) },
          { label: 'This Month', value: formatCurrency(45800) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{payout.creator}</td>
                <td className="px-6 py-4 text-sm font-medium">{formatCurrency(payout.amount)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payout.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(payout.date)}</td>
                <td className="px-6 py-4 text-right">
                  {payout.status === 'pending' && (
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Process
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
