'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Grid, List, Filter, Check, X, Clock, Download, Eye } from 'lucide-react'
import Image from 'next/image'

export default function CampaignContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState('all')

  const contentSubmissions = [
    {
      id: '1',
      creatorName: 'Sarah Johnson',
      creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      thumbnail: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
      platform: 'Instagram',
      type: 'Image',
      status: 'approved',
      submittedAt: '2024-06-15',
      caption: 'Loving this summer collection! Perfect for beach days.',
      engagement: { likes: 2500, comments: 142, shares: 89 },
    },
    {
      id: '2',
      creatorName: 'Mike Chen',
      creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      platform: 'TikTok',
      type: 'Video',
      status: 'pending',
      submittedAt: '2024-06-16',
      caption: 'Unboxing the new summer collection - link in bio!',
      engagement: { likes: 0, comments: 0, shares: 0 },
    },
    {
      id: '3',
      creatorName: 'Emma Davis',
      creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
      platform: 'Instagram',
      type: 'Reel',
      status: 'revision',
      submittedAt: '2024-06-14',
      caption: 'Summer vibes with the new collection',
      feedback: 'Please adjust lighting and retake the opening scene',
      engagement: { likes: 0, comments: 0, shares: 0 },
    },
  ]

  const statusColors = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    revision: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Content Submissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve content from creators
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="revision">Needs Revision</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>All Platforms</option>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>YouTube</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>All Types</option>
            <option>Image</option>
            <option>Video</option>
            <option>Reel</option>
            <option>Story</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentSubmissions.map((content) => (
            <div
              key={content.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square">
                <Image
                  src={content.thumbnail}
                  alt={content.caption}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusColors[content.status as keyof typeof statusColors]
                    }`}
                  >
                    {content.status}
                  </span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-black/70 text-white rounded-full text-xs font-medium">
                    {content.type}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Image
                    src={content.creatorAvatar}
                    alt={content.creatorName}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {content.creatorName}
                    </p>
                    <p className="text-xs text-gray-500">{content.platform}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{content.caption}</p>
                {content.status === 'pending' && (
                  <div className="flex gap-2">
                    <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                    <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  </div>
                )}
                {content.status === 'approved' && (
                  <button className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                )}
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
                  Creator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contentSubmissions.map((content) => (
                <tr key={content.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={content.thumbnail}
                        alt={content.caption}
                        width={64}
                        height={64}
                        className="rounded object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {content.caption}
                        </p>
                        <p className="text-xs text-gray-500">{content.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Image
                        src={content.creatorAvatar}
                        alt={content.creatorName}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span className="text-sm text-gray-900">{content.creatorName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {content.platform}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[content.status as keyof typeof statusColors]
                      }`}
                    >
                      {content.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(content.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button className="text-primary-600 hover:text-primary-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Check className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <X className="w-4 h-4" />
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
