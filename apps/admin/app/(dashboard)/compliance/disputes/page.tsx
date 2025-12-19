'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function DisputesPage() {
  const disputes = [
    { id: 'D-001', type: 'Copyright', creator: 'Sarah Johnson', status: 'investigating', date: '2024-03-15' },
    { id: 'D-002', type: 'Rights', creator: 'Mike Chen', status: 'pending', date: '2024-03-14' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
        <p className="text-gray-600 mt-2">Handle content and rights disputes</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {disputes.map((dispute) => (
              <tr key={dispute.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/compliance/disputes/${dispute.id}`} className="font-medium text-blue-600">
                    {dispute.id}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm">{dispute.type}</td>
                <td className="px-6 py-4 text-sm">{dispute.creator}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {dispute.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(dispute.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
