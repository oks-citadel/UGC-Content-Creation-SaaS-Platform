'use client';

import { useState } from 'react';
import Link from 'next/link';

const sampleSegments = [
  { id: '1', name: 'High-Value Customers', description: 'Customers with LTV > $500', members: 12847, type: 'DYNAMIC', status: 'ACTIVE', lastUpdated: '2024-01-15T10:00:00Z' },
  { id: '2', name: 'Active Creators', description: 'Creators with 5+ posts in last 30 days', members: 3421, type: 'DYNAMIC', status: 'ACTIVE', lastUpdated: '2024-01-15T09:45:00Z' },
  { id: '3', name: 'Newsletter Subscribers', description: 'Users subscribed to newsletter', members: 45892, type: 'STATIC', status: 'ACTIVE', lastUpdated: '2024-01-14T15:30:00Z' },
  { id: '4', name: 'Cart Abandoners', description: 'Users who abandoned cart in last 7 days', members: 8234, type: 'COMPUTED', status: 'ACTIVE', lastUpdated: '2024-01-15T10:15:00Z' },
  { id: '5', name: 'New Users (7 days)', description: 'Users who signed up in last 7 days', members: 2156, type: 'DYNAMIC', status: 'ACTIVE', lastUpdated: '2024-01-15T10:20:00Z' },
  { id: '6', name: 'Churned Users', description: 'Users inactive for 60+ days', members: 15234, type: 'COMPUTED', status: 'ACTIVE', lastUpdated: '2024-01-15T08:00:00Z' },
];

export default function SegmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredSegments = sampleSegments.filter((segment) => {
    if (searchQuery && !segment.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== 'ALL' && segment.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Segments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage audience segments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Create Segment
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search segments..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Types</option>
          <option value="STATIC">Static</option>
          <option value="DYNAMIC">Dynamic</option>
          <option value="COMPUTED">Computed</option>
        </select>
      </div>

      {/* Segments grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSegments.map((segment) => (
          <Link
            key={segment.id}
            href={`/dashboard/data-hub/segments/${segment.id}`}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{segment.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{segment.description}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  segment.type === 'DYNAMIC'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : segment.type === 'COMPUTED'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {segment.type}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {segment.members.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">members</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last updated</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(segment.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Create Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Segment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Segment Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., VIP Customers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Describe this segment..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                  <option value="STATIC">Static - Manual membership</option>
                  <option value="DYNAMIC">Dynamic - Rule-based, auto-updating</option>
                  <option value="COMPUTED">Computed - ML/AI generated</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
