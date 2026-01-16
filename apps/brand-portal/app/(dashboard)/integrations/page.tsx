'use client'

import { useState } from 'react'
import { Search, CheckCircle, ExternalLink, Settings as SettingsIcon } from 'lucide-react'

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const integrations = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Sync products and track sales from UGC content',
      logo: '🛍️',
      category: 'E-commerce',
      connected: true,
      features: ['Product sync', 'Order tracking', 'Analytics'],
    },
    {
      id: 'instagram',
      name: 'Instagram Business',
      description: 'Connect your Instagram account to track posts and stories',
      logo: '📸',
      category: 'Social Media',
      connected: true,
      features: ['Post tracking', 'Story metrics', 'Audience insights'],
    },
    {
      id: 'tiktok',
      name: 'TikTok for Business',
      description: 'Track TikTok videos and analyze performance',
      logo: '🎵',
      category: 'Social Media',
      connected: false,
      features: ['Video tracking', 'Performance metrics', 'Creator insights'],
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Track website traffic and conversions from UGC',
      logo: '📊',
      category: 'Analytics',
      connected: true,
      features: ['Traffic tracking', 'Conversion tracking', 'Attribution'],
    },
    {
      id: 'klaviyo',
      name: 'Klaviyo',
      description: 'Email marketing integration for creator campaigns',
      logo: '📧',
      category: 'Marketing',
      connected: false,
      features: ['Email campaigns', 'Audience segmentation', 'Automation'],
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Process payments to creators and track revenue',
      logo: '💳',
      category: 'Payments',
      connected: true,
      features: ['Payment processing', 'Revenue tracking', 'Invoicing'],
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get campaign updates and notifications in Slack',
      logo: '💬',
      category: 'Communication',
      connected: false,
      features: ['Team notifications', 'Campaign updates', 'Alerts'],
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Sync UGC campaigns with your CRM',
      logo: '🎯',
      category: 'CRM',
      connected: false,
      features: ['Contact sync', 'Deal tracking', 'Campaign attribution'],
    },
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Track YouTube videos and channel performance',
      logo: '📹',
      category: 'Social Media',
      connected: false,
      features: ['Video analytics', 'Channel metrics', 'Audience data'],
    },
  ]

  const categories = ['All', 'E-commerce', 'Social Media', 'Analytics', 'Marketing', 'Payments', 'Communication', 'CRM']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your favorite tools and platforms
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Available Integrations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{integrations.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Connected</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {integrations.filter((i) => i.connected).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{categories.length - 1}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{integration.logo}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded mt-1">
                    {integration.category}
                  </span>
                </div>
              </div>
              {integration.connected && (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Features:</p>
              <ul className="space-y-1">
                {integration.features.map((feature) => (
                  <li key={feature} className="text-xs text-gray-600 flex items-center">
                    <span className="w-1 h-1 bg-primary-600 rounded-full mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              {integration.connected ? (
                <>
                  <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Configure
                  </button>
                  <button className="flex-1 px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50">
                    Disconnect
                  </button>
                </>
              ) : (
                <button className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* API Access */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Access</h3>
            <p className="text-sm text-gray-500">
              Build custom integrations with our RESTful API
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Documentation
          </a>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">API Key</span>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Regenerate
            </button>
          </div>
          <code className="block bg-white border border-gray-200 rounded px-3 py-2 text-sm font-mono text-gray-900">
            nexus_api_xxxxxxxxxxxxxxxx...
          </code>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Webhooks</h3>
            <p className="text-sm text-gray-500">
              Receive real-time notifications for campaign events
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Add Webhook
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No webhooks configured</p>
        </div>
      </div>
    </div>
  )
}
