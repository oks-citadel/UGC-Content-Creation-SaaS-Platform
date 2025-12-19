'use client'

import { useState } from 'react'

export function CreatorFilters() {
  const [filters, setFilters] = useState({
    minFollowers: '',
    maxFollowers: '',
    minEngagement: '',
    categories: [] as string[],
    platforms: [] as string[],
    verified: false,
  })

  const categories = [
    'Fashion & Lifestyle',
    'Beauty & Wellness',
    'Tech & Gadgets',
    'Food & Cooking',
    'Fitness & Health',
    'Travel & Adventure',
    'Home & Decor',
    'Gaming & Entertainment',
  ]

  const platforms = [
    'Instagram',
    'TikTok',
    'YouTube',
    'Facebook',
    'Twitter',
    'Pinterest',
  ]

  return (
    <div className="space-y-6">
      {/* Follower Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Follower Count
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.minFollowers}
            onChange={(e) => setFilters({ ...filters, minFollowers: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxFollowers}
            onChange={(e) => setFilters({ ...filters, maxFollowers: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Engagement Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Engagement Rate (%)
        </label>
        <input
          type="number"
          placeholder="e.g., 3.5"
          value={filters.minEngagement}
          onChange={(e) => setFilters({ ...filters, minEngagement: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Categories
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilters({ ...filters, categories: [...filters.categories, category] })
                  } else {
                    setFilters({
                      ...filters,
                      categories: filters.categories.filter((c) => c !== category),
                    })
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-3 text-sm text-gray-700">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Platforms
        </label>
        <div className="grid grid-cols-2 gap-2">
          {platforms.map((platform) => (
            <label
              key={platform}
              className="flex items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.platforms.includes(platform)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilters({ ...filters, platforms: [...filters.platforms, platform] })
                  } else {
                    setFilters({
                      ...filters,
                      platforms: filters.platforms.filter((p) => p !== platform),
                    })
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Verified Only */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.verified}
            onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="ml-3 text-sm font-medium text-gray-700">
            Verified creators only
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() =>
            setFilters({
              minFollowers: '',
              maxFollowers: '',
              minEngagement: '',
              categories: [],
              platforms: [],
              verified: false,
            })
          }
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear All
        </button>
        <button className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          Apply Filters
        </button>
      </div>
    </div>
  )
}
