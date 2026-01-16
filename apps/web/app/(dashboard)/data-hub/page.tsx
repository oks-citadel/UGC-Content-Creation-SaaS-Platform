'use client';

import { useState } from 'react';
import Link from 'next/link';

const stats = [
  { name: 'Total Profiles', value: '124,582', change: '+2,847', changeType: 'positive' },
  { name: 'Events (24h)', value: '1.2M', change: '+18.2%', changeType: 'positive' },
  { name: 'Active Segments', value: '48', change: '+3', changeType: 'positive' },
  { name: 'Consent Rate', value: '94.2%', change: '+1.2%', changeType: 'positive' },
];

const dataSources = [
  { id: 'web', name: 'Web App', events: '892K', status: 'active', lastSync: '2 min ago' },
  { id: 'mobile', name: 'Mobile App', events: '256K', status: 'active', lastSync: '5 min ago' },
  { id: 'api', name: 'API', events: '48K', status: 'active', lastSync: '1 min ago' },
  { id: 'shopify', name: 'Shopify', events: '12K', status: 'active', lastSync: '15 min ago' },
];

const recentEvents = [
  { id: 1, type: 'content.viewed', source: 'web_app', user: 'user_8472', time: '2s ago' },
  { id: 2, type: 'campaign.engagement', source: 'mobile_app', user: 'user_3291', time: '5s ago' },
  { id: 3, type: 'commerce.purchase', source: 'shopify', user: 'user_1847', time: '12s ago' },
  { id: 4, type: 'user.signup', source: 'web_app', user: 'user_9283', time: '18s ago' },
  { id: 5, type: 'content.engagement', source: 'api', user: 'user_4728', time: '25s ago' },
];

const topSegments = [
  { id: 1, name: 'High-Value Customers', members: 12847, type: 'DYNAMIC' },
  { id: 2, name: 'Active Creators', members: 3421, type: 'DYNAMIC' },
  { id: 3, name: 'Newsletter Subscribers', members: 45892, type: 'STATIC' },
  { id: 4, name: 'Cart Abandoners', members: 8234, type: 'COMPUTED' },
];

const sections = [
  {
    id: 'profiles',
    name: 'Profiles',
    description: 'Customer and visitor profiles',
    icon: '👤',
    href: '/dashboard/data-hub/profiles',
    count: '124.5K',
  },
  {
    id: 'events',
    name: 'Events',
    description: 'Real-time event stream',
    icon: '⚡',
    href: '/dashboard/data-hub/events',
    count: '1.2M/day',
  },
  {
    id: 'segments',
    name: 'Segments',
    description: 'Audience segmentation',
    icon: '🎯',
    href: '/dashboard/data-hub/segments',
    count: '48',
  },
  {
    id: 'consent',
    name: 'Consent',
    description: 'Privacy & compliance',
    icon: '🔒',
    href: '/dashboard/data-hub/consent',
    count: '94.2%',
  },
];

export default function DataHubPage() {
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Hub</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Unified customer data platform
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsLiveUpdating(!isLiveUpdating)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isLiveUpdating
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveUpdating ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isLiveUpdating ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">{section.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{section.description}</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-3">{section.count}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Data Sources */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Sources</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {dataSources.map((source) => (
              <div key={source.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{source.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{source.events} events</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">Last sync: {source.lastSync}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Segments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Segments</h2>
            <Link
              href="/dashboard/data-hub/segments"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topSegments.map((segment) => (
              <div key={segment.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{segment.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {segment.members.toLocaleString()} members
                  </p>
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
            ))}
          </div>
        </div>
      </div>

      {/* Live Event Stream */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Event Stream</h2>
            {isLiveUpdating && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Streaming
              </span>
            )}
          </div>
          <Link
            href="/dashboard/data-hub/events"
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {event.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                    {event.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500">
                    {event.time}
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
