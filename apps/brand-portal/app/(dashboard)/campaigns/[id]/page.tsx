'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Users,
  Image as ImageIcon,
  BarChart3,
  FileText,
  DollarSign,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react'

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  // Mock data
  const campaign = {
    id,
    name: 'Summer Collection Launch',
    status: 'active',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    budget: 15000,
    spent: 8500,
    description: 'Launch campaign for our new summer fashion collection featuring influencer-created content across Instagram and TikTok.',
    objectives: ['Brand Awareness', 'Product Launch', 'Sales Conversion'],
    platforms: ['Instagram', 'TikTok', 'YouTube'],
  }

  const stats = [
    { label: 'Total Creators', value: '24', icon: Users },
    { label: 'Content Pieces', value: '86', icon: ImageIcon },
    { label: 'Total Reach', value: '1.2M', icon: Eye },
    { label: 'Engagement Rate', value: '4.2%', icon: Heart },
  ]

  const performanceMetrics = [
    { label: 'Impressions', value: '1,250,000', change: '+12%' },
    { label: 'Engagements', value: '42,500', change: '+18%' },
    { label: 'Clicks', value: '8,420', change: '+24%' },
    { label: 'Conversions', value: '342', change: '+31%' },
  ]

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/campaigns"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Campaigns
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {campaign.status}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{campaign.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Budget: ${campaign.budget.toLocaleString()}
              </div>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Edit Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-50">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={`/campaigns/${id}/brief`}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <FileText className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Campaign Brief</h3>
          <p className="text-sm text-gray-500">View and edit brief details</p>
        </Link>

        <Link
          href={`/campaigns/${id}/creators`}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <Users className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Creators</h3>
          <p className="text-sm text-gray-500">Manage assigned creators</p>
        </Link>

        <Link
          href={`/campaigns/${id}/content`}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <ImageIcon className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Content</h3>
          <p className="text-sm text-gray-500">Review submissions</p>
        </Link>

        <Link
          href={`/campaigns/${id}/analytics`}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <BarChart3 className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Analytics</h3>
          <p className="text-sm text-gray-500">View performance metrics</p>
        </Link>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {performanceMetrics.map((metric) => (
            <div key={metric.label} className="border-l-4 border-primary-500 pl-4">
              <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                {metric.change} vs last period
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Budget Tracking</h3>
          <span className="text-sm text-gray-500">
            ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div
            className="bg-primary-600 h-4 rounded-full transition-all"
            style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{((campaign.spent / campaign.budget) * 100).toFixed(0)}% used</span>
          <span>${(campaign.budget - campaign.spent).toLocaleString()} remaining</span>
        </div>
      </div>
    </div>
  )
}
