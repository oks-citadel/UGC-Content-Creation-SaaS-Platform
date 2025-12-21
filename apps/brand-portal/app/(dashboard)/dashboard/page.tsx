'use client'

import { TrendingUp, TrendingDown, Users, Megaphone, DollarSign, Eye, ArrowUpRight, Calendar } from 'lucide-react'
import { MetricsChart } from '@/components/analytics/MetricsChart'
import { useCampaigns } from '@/hooks/useCampaigns'
import Link from 'next/link'

const stats = [
  {
    name: 'Total Campaigns',
    value: '24',
    change: '+12%',
    changeType: 'increase',
    icon: Megaphone,
  },
  {
    name: 'Active Creators',
    value: '156',
    change: '+23%',
    changeType: 'increase',
    icon: Users,
  },
  {
    name: 'Content Pieces',
    value: '1,432',
    change: '+18%',
    changeType: 'increase',
    icon: Eye,
  },
  {
    name: 'Total Spend',
    value: '$124,500',
    change: '+8%',
    changeType: 'increase',
    icon: DollarSign,
  },
]

const recentCampaigns = [
  {
    id: 1,
    name: 'Summer Collection Launch',
    status: 'active',
    creators: 24,
    content: 86,
    budget: '$15,000',
    roi: '+340%',
  },
  {
    id: 2,
    name: 'Brand Awareness Q2',
    status: 'active',
    creators: 18,
    content: 52,
    budget: '$10,000',
    roi: '+285%',
  },
  {
    id: 3,
    name: 'Product Launch - Sneakers',
    status: 'completed',
    creators: 32,
    content: 124,
    budget: '$25,000',
    roi: '+412%',
  },
]

export default function DashboardPage() {
  const { campaigns, isLoading } = useCampaigns()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here&apos;s what&apos;s happening with your campaigns.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Megaphone className="w-4 h-4 mr-2" />
          New Campaign
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-50">
                    <stat.icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'increase'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stat.changeType === 'increase' ? (
                          <TrendingUp className="w-4 h-4 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-0.5" />
                        )}
                        <span>{stat.change}</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
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
            <h3 className="text-lg font-semibold text-gray-900">Content by Platform</h3>
            <select className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
              <option>This month</option>
              <option>Last month</option>
              <option>Last quarter</option>
            </select>
          </div>
          <MetricsChart type="bar" />
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
            <Link
              href="/campaigns"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center"
            >
              View all
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creators
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.creators}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.content}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.budget}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">
                      {campaign.roi}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Link
          href="/campaigns/new"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <Megaphone className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Create Campaign</h3>
          <p className="text-sm text-gray-500">Launch a new UGC campaign</p>
        </Link>

        <Link
          href="/marketplace"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <Users className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Find Creators</h3>
          <p className="text-sm text-gray-500">Browse our creator marketplace</p>
        </Link>

        <Link
          href="/analytics"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <Calendar className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">View Analytics</h3>
          <p className="text-sm text-gray-500">Deep dive into performance</p>
        </Link>
      </div>
    </div>
  )
}
