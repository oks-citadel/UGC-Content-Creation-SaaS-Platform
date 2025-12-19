'use client'

import { useState } from 'react'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import { CreatorCard } from '@/components/marketplace/CreatorCard'
import { CreatorFilters } from '@/components/marketplace/CreatorFilters'
import { useCreators } from '@/hooks/useCreators'

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const { creators, isLoading } = useCreators()

  const mockCreators = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      coverImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
      followers: 125000,
      engagement: 4.8,
      niche: 'Fashion & Lifestyle',
      platforms: ['Instagram', 'TikTok'],
      location: 'Los Angeles, CA',
      rating: 4.9,
      completedCampaigns: 45,
      avgCost: 1200,
      verified: true,
    },
    {
      id: '2',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      coverImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800',
      followers: 89000,
      engagement: 5.2,
      niche: 'Tech & Gadgets',
      platforms: ['YouTube', 'Instagram'],
      location: 'San Francisco, CA',
      rating: 4.8,
      completedCampaigns: 32,
      avgCost: 950,
      verified: true,
    },
    {
      id: '3',
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      coverImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
      followers: 210000,
      engagement: 3.9,
      niche: 'Beauty & Wellness',
      platforms: ['Instagram', 'YouTube'],
      location: 'New York, NY',
      rating: 5.0,
      completedCampaigns: 67,
      avgCost: 1800,
      verified: true,
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      coverImage: 'https://images.unsplash.com/photo-1551847677-dc82d764e1eb?w=800',
      followers: 156000,
      engagement: 4.5,
      niche: 'Fitness & Health',
      platforms: ['TikTok', 'Instagram', 'YouTube'],
      location: 'Miami, FL',
      rating: 4.7,
      completedCampaigns: 51,
      avgCost: 1400,
      verified: true,
    },
    {
      id: '5',
      name: 'Jessica Lee',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      coverImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
      followers: 98000,
      engagement: 5.8,
      niche: 'Food & Cooking',
      platforms: ['Instagram', 'TikTok'],
      location: 'Austin, TX',
      rating: 4.9,
      completedCampaigns: 28,
      avgCost: 800,
      verified: false,
    },
    {
      id: '6',
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
      coverImage: 'https://images.unsplash.com/photo-1496449903678-68ddcb189a24?w=800',
      followers: 175000,
      engagement: 4.1,
      niche: 'Travel & Adventure',
      platforms: ['Instagram', 'YouTube'],
      location: 'Seattle, WA',
      rating: 4.8,
      completedCampaigns: 42,
      avgCost: 1600,
      verified: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Creator Marketplace</h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover and collaborate with talented creators
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, niche, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {showFilters && ' (Active)'}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <CreatorFilters />
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{mockCreators.length}</span> creators
        </p>
        <select className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
          <option>Sort by: Recommended</option>
          <option>Highest Rating</option>
          <option>Most Followers</option>
          <option>Best Engagement</option>
          <option>Lowest Cost</option>
        </select>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCreators.map((creator) => (
          <CreatorCard key={creator.id} creator={creator} />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          Load More Creators
        </button>
      </div>
    </div>
  )
}
