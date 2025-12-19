'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Building2, MoreVertical } from 'lucide-react';
import { formatNumber, formatCurrency, formatDate } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  industry: string;
  status: 'active' | 'inactive' | 'suspended';
  members: number;
  campaigns: number;
  mrr: number;
  createdAt: string;
}

export default function OrganizationsPage() {
  const [organizations] = useState<Organization[]>([
    {
      id: '1',
      name: 'Acme Corp',
      industry: 'Technology',
      status: 'active',
      members: 12,
      campaigns: 24,
      mrr: 1499,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Fashion Co',
      industry: 'Fashion',
      status: 'active',
      members: 8,
      campaigns: 18,
      mrr: 999,
      createdAt: '2024-02-01T10:00:00Z',
    },
    {
      id: '3',
      name: 'Food Brand',
      industry: 'Food & Beverage',
      status: 'active',
      members: 5,
      campaigns: 10,
      mrr: 499,
      createdAt: '2024-02-20T10:00:00Z',
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-2">Manage brand organizations and teams</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Building2 className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Organizations', value: '1,240' },
          { label: 'Active', value: '980' },
          { label: 'Total Members', value: '8,420' },
          { label: 'Total MRR', value: formatCurrency(284000) },
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
              placeholder="Search organizations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaigns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MRR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/organizations/${org.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {org.industry}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {org.members}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {org.campaigns}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(org.mrr)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        org.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : org.status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(org.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="p-1 rounded hover:bg-gray-100">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
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
