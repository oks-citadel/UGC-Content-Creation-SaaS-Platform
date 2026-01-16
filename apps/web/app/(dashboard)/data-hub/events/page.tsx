'use client';

import { useState } from 'react';

const eventTypes = [
  'All Events',
  'user.signup',
  'user.login',
  'content.viewed',
  'content.engagement',
  'campaign.started',
  'commerce.purchase',
];

const sources = ['All Sources', 'web_app', 'mobile_app', 'api', 'webhook', 'shopify'];

const sampleEvents = [
  { id: '1', type: 'user.signup', source: 'web_app', userId: 'usr_8472a', timestamp: '2024-01-15T10:30:45Z', payload: { email: 'user@example.com', plan: 'starter' } },
  { id: '2', type: 'content.viewed', source: 'mobile_app', userId: 'usr_3291b', timestamp: '2024-01-15T10:30:42Z', payload: { contentId: 'cnt_123', duration: 45 } },
  { id: '3', type: 'commerce.purchase', source: 'shopify', userId: 'usr_1847c', timestamp: '2024-01-15T10:30:38Z', payload: { orderId: 'ord_456', amount: 129.99 } },
  { id: '4', type: 'campaign.started', source: 'api', userId: 'usr_9283d', timestamp: '2024-01-15T10:30:35Z', payload: { campaignId: 'cmp_789', name: 'Summer Sale' } },
  { id: '5', type: 'content.engagement', source: 'web_app', userId: 'usr_4728e', timestamp: '2024-01-15T10:30:30Z', payload: { contentId: 'cnt_234', action: 'like' } },
  { id: '6', type: 'user.login', source: 'mobile_app', userId: 'usr_5839f', timestamp: '2024-01-15T10:30:25Z', payload: { device: 'iPhone 15', os: 'iOS 17' } },
  { id: '7', type: 'commerce.purchase', source: 'shopify', userId: 'usr_6940g', timestamp: '2024-01-15T10:30:20Z', payload: { orderId: 'ord_567', amount: 79.99 } },
  { id: '8', type: 'content.viewed', source: 'web_app', userId: 'usr_7051h', timestamp: '2024-01-15T10:30:15Z', payload: { contentId: 'cnt_345', duration: 120 } },
];

export default function EventsPage() {
  const [selectedType, setSelectedType] = useState('All Events');
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [isLive, setIsLive] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filteredEvents = sampleEvents.filter((event) => {
    if (selectedType !== 'All Events' && event.type !== selectedType) return false;
    if (selectedSource !== 'All Sources' && event.source !== selectedSource) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Stream</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time event data from all sources
          </p>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isLive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {isLive ? 'Live' : 'Paused'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          {eventTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          {sources.map((source) => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by user ID..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Event list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredEvents.map((event) => (
            <div key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {event.type}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{event.source}</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">{event.userId}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedEvent === event.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {expandedEvent === event.id && (
                <div className="px-4 pb-4">
                  <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredEvents.length} of 1,234,567 events
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Previous
          </button>
          <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
