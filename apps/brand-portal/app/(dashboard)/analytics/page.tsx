'use client'

import { MetricsChart } from '@/components/analytics/MetricsChart'
import { AttributionTable } from '@/components/analytics/AttributionTable'
import { TrendingUp, TrendingDown, Eye, Heart, Share2, DollarSign, Users, Image } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsPage() {
  const overviewMetrics = [
    {
      label: 'Total Impressions',
      value: '3.2M',
      change: '+15.3%',
      trend: 'up',
      icon: Eye,
    },
    {
      label: 'Total Engagement',
      value: '156K',
      change: '+12.8%',
      trend: 'up',
      icon: Heart,
    },
    {
      label: 'Avg. Engagement Rate',
      value: '4.9%',
      change: '+0.6%',
      trend: 'up',
      icon: TrendingUp,
    },
    {
      label: 'Total Revenue',
      value: '$124.5K',
      change: '+22.4%',
      trend: 'up',
      icon: DollarSign,
    },
  ]

  const campaignPerformance = [
    {
      name: 'Summer Collection',
      impressions: 1250000,
      engagement: 52000,
      conversions: 342,
      revenue: 45600,
      roi: 340,
    },
    {
      name: 'Brand Awareness Q2',
      impressions: 890000,
      engagement: 38000,
      conversions: 234,
      revenue: 32100,
      roi: 285,
    },
    {
      name: 'Product Launch',
      impressions: 1060000,
      engagement: 66000,
      conversions: 412,
      revenue: 46800,
      roi: 412,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive performance insights across all campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
          <Link
            href="/analytics/attribution"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Attribution Reports
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-50">
                <metric.icon className="h-6 w-6 text-primary-600" />
              </div>
              <span
                className={`text-sm font-medium flex items-center ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {metric.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {metric.change}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Engagement Trends</h3>
            <select className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
              <option>Impressions</option>
              <option>Engagement</option>
              <option>Conversions</option>
            </select>
          </div>
          <MetricsChart type="line" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Platform Distribution</h3>
            <select className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
              <option>By Impressions</option>
              <option>By Engagement</option>
              <option>By Revenue</option>
            </select>
          </div>
          <MetricsChart type="pie" />
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Impressions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignPerformance.map((campaign) => (
                <tr key={campaign.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{campaign.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(campaign.impressions / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(campaign.engagement / 1000).toFixed(1)}K
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.conversions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${(campaign.revenue / 1000).toFixed(1)}K
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">
                      +{campaign.roi}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Creators</h3>
          <MetricsChart type="bar" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Performance</h3>
          <MetricsChart type="bar" />
        </div>
      </div>

      {/* Attribution Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Attribution Summary</h3>
          <Link
            href="/analytics/attribution"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Full Report
          </Link>
        </div>
        <AttributionTable campaignId="all" />
      </div>
    </div>
  )
}
