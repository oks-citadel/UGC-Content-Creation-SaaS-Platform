'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Filter } from 'lucide-react'
import Link from 'next/link'
import { AttributionTable } from '@/components/analytics/AttributionTable'

export default function AttributionPage() {
  const [dateRange, setDateRange] = useState('30')
  const [model, setModel] = useState('last-click')

  const attributionModels = [
    { value: 'last-click', label: 'Last Click' },
    { value: 'first-click', label: 'First Click' },
    { value: 'linear', label: 'Linear' },
    { value: 'time-decay', label: 'Time Decay' },
    { value: 'position-based', label: 'Position Based' },
  ]

  const summaryMetrics = [
    { label: 'Total Conversions', value: '988' },
    { label: 'Attributed Revenue', value: '$124,500' },
    { label: 'Avg. Touchpoints', value: '3.2' },
    { label: 'Conversion Rate', value: '2.8%' },
  ]

  return (
    <div className="space-y-6">
      <Link
        href="/analytics"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Analytics
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attribution Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Understand the customer journey and touchpoint impact
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attribution Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {attributionModels.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>All Campaigns</option>
              <option>Summer Collection</option>
              <option>Brand Awareness Q2</option>
              <option>Product Launch</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>All Platforms</option>
              <option>Instagram</option>
              <option>TikTok</option>
              <option>YouTube</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {summaryMetrics.map((metric) => (
          <div key={metric.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Attribution Model Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          {attributionModels.find((m) => m.value === model)?.label} Attribution
        </h4>
        <p className="text-sm text-blue-800">
          {model === 'last-click' &&
            'Credits 100% of the conversion to the last touchpoint before conversion.'}
          {model === 'first-click' &&
            'Credits 100% of the conversion to the first touchpoint in the customer journey.'}
          {model === 'linear' &&
            'Distributes credit equally across all touchpoints in the customer journey.'}
          {model === 'time-decay' &&
            'Gives more credit to touchpoints closer to the conversion event.'}
          {model === 'position-based' &&
            'Credits 40% to first and last touchpoints, 20% distributed among middle touchpoints.'}
        </p>
      </div>

      {/* Attribution Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detailed Attribution Data
        </h3>
        <AttributionTable campaignId="all" />
      </div>

      {/* Conversion Paths */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Conversion Paths
        </h3>
        <div className="space-y-3">
          {[
            { path: 'Instagram → Website → Purchase', conversions: 234, revenue: 32100 },
            { path: 'TikTok → Instagram → Website → Purchase', conversions: 189, revenue: 28400 },
            { path: 'YouTube → Website → Purchase', conversions: 156, revenue: 21800 },
            { path: 'Instagram → TikTok → Website → Purchase', conversions: 142, revenue: 19600 },
          ].map((path, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{path.path}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {path.conversions} conversions • ${path.revenue.toLocaleString()} revenue
                </p>
              </div>
              <div className="ml-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(path.conversions / 234) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
