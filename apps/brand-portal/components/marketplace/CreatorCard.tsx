'use client'

import Link from 'next/link'
import { MapPin, Star, TrendingUp, CheckCircle } from 'lucide-react'

type Creator = {
  id: string
  name: string
  avatar: string
  coverImage: string
  followers: number
  engagement: number
  niche: string
  platforms: string[]
  location: string
  rating: number
  completedCampaigns: number
  avgCost: number
  verified: boolean
}

export function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Cover Image */}
      <div className="relative h-32">
        <img
          src={creator.coverImage}
          alt={creator.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Avatar */}
      <div className="relative px-6 -mt-12">
        <div className="relative">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-20 h-20 rounded-full border-4 border-white object-cover"
          />
          {creator.verified && (
            <div className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 pt-3">
        <div className="mb-3">
          <Link
            href={`/marketplace/${creator.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary-600"
          >
            {creator.name}
          </Link>
          <p className="text-sm text-gray-500 mt-1">{creator.niche}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-1">Followers</p>
            <p className="text-sm font-semibold text-gray-900">
              {(creator.followers / 1000).toFixed(0)}K
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Engagement</p>
            <p className="text-sm font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              {creator.engagement}%
            </p>
          </div>
        </div>

        {/* Platform Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {creator.platforms.map((platform) => (
            <span
              key={platform}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {platform}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <span className="flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {creator.location}
          </span>
          <span className="flex items-center">
            <Star className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400" />
            {creator.rating}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/marketplace/${creator.id}`}
            className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            View Profile
          </Link>
          <button className="flex-1 text-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            Invite
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-3">
          Avg. ${creator.avgCost}/post • {creator.completedCampaigns} campaigns
        </p>
      </div>
    </div>
  )
}
