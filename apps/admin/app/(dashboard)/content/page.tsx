'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, FileVideo, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Content {
  id: string;
  title: string;
  creator: string;
  campaign: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  submittedAt: string;
  reviewedAt?: string;
  flags?: number;
}

export default function ContentModerationPage() {
  const [content] = useState<Content[]>([
    {
      id: '1',
      title: 'Product Review Video',
      creator: 'Sarah Johnson',
      campaign: 'Summer Campaign 2024',
      status: 'pending',
      submittedAt: '2024-03-20T10:00:00Z',
      flags: 0,
    },
    {
      id: '2',
      title: 'Brand Showcase',
      creator: 'Mike Chen',
      campaign: 'Tech Launch',
      status: 'flagged',
      submittedAt: '2024-03-19T15:30:00Z',
      flags: 3,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
          <p className="text-gray-600 mt-2">Review and moderate user-generated content</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending Review', value: '120', color: 'yellow' },
          { label: 'Approved Today', value: '45', color: 'green' },
          { label: 'Flagged', value: '8', color: 'red' },
          { label: 'Total Reviewed', value: '1,234', color: 'blue' },
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
              placeholder="Search content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Flagged</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Creator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Submitted
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {content.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileVideo className="w-5 h-5 text-gray-400" />
                    <Link
                      href={`/content/${item.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {item.title}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{item.creator}</td>
                <td className="px-6 py-4 text-sm">{item.campaign}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : item.status === 'flagged'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.flags && item.flags > 0 && (
                      <span className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertTriangle className="w-3 h-3" />
                        {item.flags}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(item.submittedAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/content/${item.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
