'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Megaphone } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function CampaignsPage() {
  const [campaigns] = useState([
    {
      id: '1',
      name: 'Summer Campaign 2024',
      organization: 'Acme Corp',
      status: 'active',
      budget: 5000,
      spent: 3200,
      content: 24,
      startDate: '2024-03-01',
      endDate: '2024-06-30',
    },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        <p className="text-gray-600 mt-2">Monitor all platform campaigns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Campaigns', value: '456' },
          { label: 'Active', value: '123' },
          { label: 'Total Budget', value: formatCurrency(1240000) },
          { label: 'Content Created', value: '12,450' },
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/campaigns/${campaign.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                    {campaign.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm">{campaign.organization}</td>
                <td className="px-6 py-4 text-sm">{formatCurrency(campaign.budget)}</td>
                <td className="px-6 py-4 text-sm">{formatCurrency(campaign.spent)}</td>
                <td className="px-6 py-4 text-sm">{campaign.content}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {campaign.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
