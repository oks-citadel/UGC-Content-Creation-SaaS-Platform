'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, Grid, List, Download, Eye, Heart, Plus, Folder } from 'lucide-react'

export default function ContentLibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  const contentItems = [
    {
      id: '1',
      thumbnail: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
      type: 'image',
      campaign: 'Summer Collection',
      creator: 'Sarah Johnson',
      platform: 'Instagram',
      date: '2024-06-15',
      views: 52300,
      likes: 2100,
      tags: ['fashion', 'summer', 'lifestyle'],
    },
    {
      id: '2',
      thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      type: 'video',
      campaign: 'Brand Awareness Q2',
      creator: 'Mike Chen',
      platform: 'TikTok',
      date: '2024-06-16',
      views: 142000,
      likes: 8400,
      tags: ['tech', 'review', 'unboxing'],
    },
    {
      id: '3',
      thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
      type: 'image',
      campaign: 'Product Launch',
      creator: 'Emma Davis',
      platform: 'Instagram',
      date: '2024-06-14',
      views: 68900,
      likes: 3200,
      tags: ['beauty', 'skincare', 'wellness'],
    },
    {
      id: '4',
      thumbnail: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
      type: 'image',
      campaign: 'Summer Collection',
      creator: 'Jessica Lee',
      platform: 'Instagram',
      date: '2024-06-13',
      views: 39400,
      likes: 1420,
      tags: ['fashion', 'style', 'ootd'],
    },
    {
      id: '5',
      thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
      type: 'video',
      campaign: 'Brand Awareness Q2',
      creator: 'Alex Rodriguez',
      platform: 'YouTube',
      date: '2024-06-12',
      views: 95600,
      likes: 4280,
      tags: ['fitness', 'workout', 'health'],
    },
    {
      id: '6',
      thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
      type: 'image',
      campaign: 'Product Launch',
      creator: 'David Kim',
      platform: 'Instagram',
      date: '2024-06-11',
      views: 72100,
      likes: 3150,
      tags: ['travel', 'adventure', 'lifestyle'],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            All your UGC content in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/content/galleries"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Folder className="w-4 h-4 mr-2" />
            Galleries
          </Link>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            <Plus className="w-4 h-4 mr-2" />
            Upload Content
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>All Campaigns</option>
            <option>Summer Collection</option>
            <option>Brand Awareness Q2</option>
            <option>Product Launch</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>All Platforms</option>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>YouTube</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </button>
          <div className="flex items-center gap-2 border-l pl-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Content</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">1,432</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Views</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">2.4M</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Engagement</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">156K</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Avg. Engagement Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">6.5%</p>
        </div>
      </div>

      {/* Content Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="relative aspect-square">
                <img
                  src={item.thumbnail}
                  alt={item.campaign}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                    <button className="p-2 bg-white/90 rounded-lg hover:bg-white">
                      <Eye className="w-5 h-5 text-gray-700" />
                    </button>
                    <button className="p-2 bg-white/90 rounded-lg hover:bg-white">
                      <Download className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {(item.views / 1000).toFixed(1)}K
                      </span>
                      <span className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {(item.likes / 1000).toFixed(1)}K
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-black/70 text-white rounded-full text-xs font-medium capitalize">
                    {item.type}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900 truncate">{item.campaign}</p>
                <p className="text-xs text-gray-500 mt-1">By {item.creator}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">{item.platform}</span>
                  <span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Creator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Engagement
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.thumbnail}
                        alt={item.campaign}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">{item.type}</p>
                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.campaign}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.creator}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.platform}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.views.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.likes.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
