'use client';

import { formatDate } from '@/lib/utils';

export default function RightsManagementPage() {
  const rights = [
    { id: 'R-001', content: 'Video-123', creator: 'Sarah Johnson', status: 'approved', date: '2024-03-15' },
    { id: 'R-002', content: 'Video-124', creator: 'Mike Chen', status: 'pending', date: '2024-03-14' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rights Management</h1>
        <p className="text-gray-600 mt-2">Manage content usage rights and licenses</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rights.map((right) => (
              <tr key={right.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{right.id}</td>
                <td className="px-6 py-4 text-sm">{right.content}</td>
                <td className="px-6 py-4 text-sm">{right.creator}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    right.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {right.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(right.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
