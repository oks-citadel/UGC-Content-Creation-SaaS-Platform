'use client'

import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, TrendingUp, Eye, Heart, Share2, DollarSign } from 'lucide-react'
import { MetricsChart } from '@/components/analytics/MetricsChart'
import { AttributionTable } from '@/components/analytics/AttributionTable'

export default function CampaignAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const metrics = [
    {
      label: 'Total Impressions',
      value: '1,250,000',
      change: '+12.5%',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Engagement Rate',
      value: '4.2%',
      change: '+0.8%',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      label: 'Total Shares',
      value: '8,420',
      change: '+18.3%',
      icon: Share2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'ROI',
      value: '340%',
      change: '+45%',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  const platformPerformance = [
    { platform: 'Instagram', posts: 42, reach: 580000, engagement: 24500, conversions: 156 },
    { platform: 'TikTok', posts: 28, reach: 420000, engagement: 18900, conversions: 124 },
    { platform: 'YouTube', posts: 16, reach: 250000, engagement: 12100, conversions: 62 },
  ]

  return (
    <div className="space-y-6">
      <Link
        href={`/campaigns/${id}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Campaign
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campaign Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Detailed performance metrics and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                {metric.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{metric.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Engagement Over Time</h3>
            <select className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <MetricsChart type="line" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Platform Distribution</h3>
            <select className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
              <option>Impressions</option>
              <option>Engagement</option>
              <option>Conversions</option>
            </select>
          </div>
          <MetricsChart type="pie" />
        </div>
      </div>

      {/* Platform Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Platform Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Reach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {platformPerformance.map((platform) => (
                <tr key={platform.platform} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{platform.platform}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {platform.posts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {platform.reach.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {platform.engagement.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {platform.conversions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-600">
                      {((platform.conversions / platform.reach) * 100).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attribution Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attribution Report</h3>
        <AttributionTable campaignId={id} />
      </div>

      {/* Top Performing Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Content</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative group aspect-square">
              <Image
                src={`https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=400`}
                alt={`Top content ${i}`}
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-sm font-medium">Sarah Johnson</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      52.3K
                    </span>
                    <span className="flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      2.1K
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
