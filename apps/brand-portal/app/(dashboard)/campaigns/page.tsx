'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Calendar, MoreVertical, Users, Image as ImageIcon, DollarSign } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
}

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { campaigns, isLoading } = useCampaigns()

  const mockCampaigns = [
    {
      id: '1',
      name: 'Summer Collection Launch',
      status: 'active',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      budget: 15000,
      spent: 8500,
      creators: 24,
      content: 86,
      impressions: 1250000,
      engagement: 42500,
    },
    {
      id: '2',
      name: 'Brand Awareness Q2',
      status: 'active',
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      budget: 10000,
      spent: 9200,
      creators: 18,
      content: 52,
      impressions: 890000,
      engagement: 31200,
    },
    {
      id: '3',
      name: 'Product Launch - Sneakers',
      status: 'completed',
      startDate: '2024-03-01',
      endDate: '2024-05-31',
      budget: 25000,
      spent: 24800,
      creators: 32,
      content: 124,
      impressions: 2100000,
      engagement: 78400,
    },
    {
      id: '4',
      name: 'Holiday Gift Guide',
      status: 'draft',
      startDate: '2024-11-01',
      endDate: '2024-12-31',
      budget: 20000,
      spent: 0,
      creators: 0,
      content: 0,
      impressions: 0,
      engagement: 0,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track your UGC campaigns
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {mockCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {campaign.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[campaign.status as keyof typeof statusColors]
                      }`}
                    >
                      {campaign.status}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Users className="w-4 h-4 mr-1" />
                    Creators
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{campaign.creators}</p>
                </div>
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Content
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{campaign.content}</p>
                </div>
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Spent
                  </div>
                  <p className="text-xl font-semibold text-gray-900">
                    ${(campaign.spent / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Budget Used</span>
                  <span className="font-medium text-gray-900">
                    ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Details
                </Link>
                <Link
                  href={`/campaigns/${campaign.id}/analytics`}
                  className="flex-1 text-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Analytics
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {mockCampaigns.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first campaign</p>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Link>
        </div>
      )}
    </div>
  )
}
