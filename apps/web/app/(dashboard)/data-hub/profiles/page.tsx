'use client';

import { useState } from 'react';
import Link from 'next/link';

const sampleProfiles = [
  {
    id: '1',
    email: 'sarah.johnson@email.com',
    name: 'Sarah Johnson',
    traits: { ltv: 1250, orders: 15, preferredChannel: 'email' },
    segments: ['High-Value Customers', 'Active Creators'],
    lastSeen: '2024-01-15T14:30:00Z',
    createdAt: '2023-06-15T10:00:00Z',
    eventsCount: 342,
    source: 'web'
  },
  {
    id: '2',
    email: 'mike.chen@company.com',
    name: 'Mike Chen',
    traits: { ltv: 850, orders: 8, preferredChannel: 'sms' },
    segments: ['Newsletter Subscribers'],
    lastSeen: '2024-01-15T12:15:00Z',
    createdAt: '2023-08-22T15:30:00Z',
    eventsCount: 186,
    source: 'mobile'
  },
  {
    id: '3',
    email: 'emma.wilson@gmail.com',
    name: 'Emma Wilson',
    traits: { ltv: 2100, orders: 24, preferredChannel: 'push' },
    segments: ['High-Value Customers', 'VIP', 'Active Creators'],
    lastSeen: '2024-01-15T16:45:00Z',
    createdAt: '2023-03-10T09:00:00Z',
    eventsCount: 891,
    source: 'web'
  },
  {
    id: '4',
    email: 'alex.rodriguez@business.net',
    name: 'Alex Rodriguez',
    traits: { ltv: 320, orders: 3, preferredChannel: 'email' },
    segments: ['New Users (7 days)'],
    lastSeen: '2024-01-15T11:00:00Z',
    createdAt: '2024-01-08T14:20:00Z',
    eventsCount: 28,
    source: 'referral'
  },
  {
    id: '5',
    email: 'lisa.park@domain.org',
    name: 'Lisa Park',
    traits: { ltv: 580, orders: 6, preferredChannel: 'email' },
    segments: ['Cart Abandoners', 'Newsletter Subscribers'],
    lastSeen: '2024-01-14T18:30:00Z',
    createdAt: '2023-11-05T11:45:00Z',
    eventsCount: 124,
    source: 'web'
  },
  {
    id: '6',
    email: 'james.taylor@mail.com',
    name: 'James Taylor',
    traits: { ltv: 0, orders: 0, preferredChannel: 'email' },
    segments: ['Churned Users'],
    lastSeen: '2023-11-10T09:00:00Z',
    createdAt: '2023-05-20T16:30:00Z',
    eventsCount: 45,
    source: 'social'
  },
];

export default function ProfilesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<typeof sampleProfiles[0] | null>(null);

  const filteredProfiles = sampleProfiles.filter((profile) => {
    if (searchQuery &&
        !profile.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !profile.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (sourceFilter !== 'ALL' && profile.source !== sourceFilter) return false;
    return true;
  });

  const openProfile = (profile: typeof sampleProfiles[0]) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profiles</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Unified customer profiles with traits and event history
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
            Export
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Import Profiles
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Profiles</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">124,892</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">+2.4% from last week</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Identified</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">89,234</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">71.5% of total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Anonymous</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">35,658</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">28.5% of total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Events/Profile</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">156</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">+8.2% engagement</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Sources</option>
          <option value="web">Web</option>
          <option value="mobile">Mobile</option>
          <option value="social">Social</option>
          <option value="referral">Referral</option>
        </select>
      </div>

      {/* Profiles table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Profile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Segments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                LTV
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Events
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Seen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProfiles.map((profile) => (
              <tr
                key={profile.id}
                onClick={() => openProfile(profile)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{profile.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {profile.segments.slice(0, 2).map((segment, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {segment}
                      </span>
                    ))}
                    {profile.segments.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        +{profile.segments.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    ${profile.traits.ltv.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {profile.eventsCount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile.source === 'web'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : profile.source === 'mobile'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : profile.source === 'social'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {profile.source}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(profile.lastSeen).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing 1-6 of 124,892 profiles
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-3 py-1 rounded bg-indigo-600 text-white">1</button>
          <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">2</button>
          <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">3</button>
          <span className="px-3 py-1 text-gray-400">...</span>
          <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
            Next
          </button>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Details</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                    {selectedProfile.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProfile.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{selectedProfile.email}</p>
                </div>
              </div>

              {/* Traits */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Traits</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Lifetime Value</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">${selectedProfile.traits.ltv.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProfile.traits.orders}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Preferred Channel</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{selectedProfile.traits.preferredChannel}</p>
                  </div>
                </div>
              </div>

              {/* Segments */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Segments</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.segments.map((segment, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
                    >
                      {segment}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Activity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Events</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProfile.eventsCount.toLocaleString()}</p>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Seen</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedProfile.lastSeen).toLocaleString()}
                    </p>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Profile Created</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedProfile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Source</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{selectedProfile.source}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/dashboard/data-hub/profiles/${selectedProfile.id}`}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
                >
                  View Full Profile
                </Link>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Edit
                </button>
                <button className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
