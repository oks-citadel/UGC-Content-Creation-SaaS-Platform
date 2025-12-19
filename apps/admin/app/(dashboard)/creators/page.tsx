'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';

interface Creator {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  status: 'active' | 'pending' | 'suspended';
  followers: number;
  content: number;
  earnings: number;
  joinedAt: string;
}

export default function CreatorsPage() {
  const [creators] = useState<Creator[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      verified: true,
      status: 'active',
      followers: 125000,
      content: 48,
      earnings: 12450,
      joinedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      verified: false,
      status: 'pending',
      followers: 45000,
      content: 12,
      earnings: 0,
      joinedAt: '2024-03-10T10:00:00Z',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creator Management</h1>
          <p className="text-gray-600 mt-2">Manage and verify content creators</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Creators', value: '8,920' },
          { label: 'Verified', value: '6,540' },
          { label: 'Pending Verification', value: '380' },
          { label: 'Active This Month', value: '5,234' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search creators..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Verification</option>
            <option>Verified</option>
            <option>Not Verified</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Creator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Followers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {creators.map((creator) => (
                <tr key={creator.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <Link
                        href={`/creators/${creator.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {creator.name}
                      </Link>
                      <p className="text-sm text-gray-500">{creator.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {creator.verified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatNumber(creator.followers)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {creator.content}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${formatNumber(creator.earnings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        creator.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : creator.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {creator.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(creator.joinedAt)}
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
