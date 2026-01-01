'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Search, Filter, Plus, Mail, MessageCircle, MoreVertical } from 'lucide-react'
import { CreatorCard } from '@/components/marketplace/CreatorCard'

export default function CampaignCreatorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [searchQuery, setSearchQuery] = useState('')

  const assignedCreators = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      followers: 125000,
      engagement: 4.8,
      niche: 'Fashion & Lifestyle',
      platforms: ['Instagram', 'TikTok'],
      status: 'active',
      contentSubmitted: 4,
      contentApproved: 3,
    },
    {
      id: '2',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      followers: 89000,
      engagement: 5.2,
      niche: 'Tech & Gadgets',
      platforms: ['YouTube', 'Instagram'],
      status: 'active',
      contentSubmitted: 2,
      contentApproved: 2,
    },
    {
      id: '3',
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      followers: 210000,
      engagement: 3.9,
      niche: 'Beauty & Wellness',
      platforms: ['Instagram', 'YouTube'],
      status: 'pending',
      contentSubmitted: 0,
      contentApproved: 0,
    },
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Creators</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage creators assigned to this campaign
          </p>
        </div>
        <Link
          href={`/marketplace?campaign=${id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Creators
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Completed</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Creators List */}
      <div className="grid grid-cols-1 gap-6">
        {assignedCreators.map((creator) => (
          <div
            key={creator.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start gap-6">
              <Image
                src={creator.avatar}
                alt={creator.name}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{creator.name}</h3>
                    <p className="text-sm text-gray-500">{creator.niche}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{creator.followers.toLocaleString()} followers</span>
                      <span>{creator.engagement}% engagement</span>
                      <span className="flex gap-1">
                        {creator.platforms.map((platform) => (
                          <span key={platform} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {platform}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        creator.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {creator.status}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500 mb-1">Content Submitted</p>
                    <p className="text-2xl font-semibold text-gray-900">{creator.contentSubmitted}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500 mb-1">Content Approved</p>
                    <p className="text-2xl font-semibold text-gray-900">{creator.contentApproved}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/marketplace/${creator.id}`}
                    className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Profile
                  </Link>
                  <button className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </button>
                  <button className="flex-1 text-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
