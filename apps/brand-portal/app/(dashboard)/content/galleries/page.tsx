'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Grid, Eye, ShoppingCart, ExternalLink, MoreVertical } from 'lucide-react'

export default function GalleriesPage() {
  const galleries = [
    {
      id: '1',
      name: 'Summer Collection 2024',
      description: 'Curated UGC for summer fashion launch',
      itemCount: 24,
      views: 15420,
      clicks: 892,
      revenue: 12450,
      status: 'published',
      thumbnail: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
      updatedAt: '2024-06-15',
    },
    {
      id: '2',
      name: 'Product Showcase',
      description: 'Best performing product content',
      itemCount: 18,
      views: 8920,
      clicks: 524,
      revenue: 8750,
      status: 'published',
      thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      updatedAt: '2024-06-14',
    },
    {
      id: '3',
      name: 'Influencer Highlights',
      description: 'Top creator content from Q2',
      itemCount: 32,
      views: 22100,
      clicks: 1240,
      revenue: 18900,
      status: 'published',
      thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
      updatedAt: '2024-06-10',
    },
    {
      id: '4',
      name: 'Holiday Gift Guide',
      description: 'Upcoming holiday campaign content',
      itemCount: 0,
      views: 0,
      clicks: 0,
      revenue: 0,
      status: 'draft',
      thumbnail: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
      updatedAt: '2024-06-08',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shoppable Galleries</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage shoppable UGC galleries
          </p>
        </div>
        <Link
          href="/content/galleries/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Gallery
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Galleries</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{galleries.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Views</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {(galleries.reduce((sum, g) => sum + g.views, 0) / 1000).toFixed(1)}K
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Clicks</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {galleries.reduce((sum, g) => sum + g.clicks, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${(galleries.reduce((sum, g) => sum + g.revenue, 0) / 1000).toFixed(1)}K
          </p>
        </div>
      </div>

      {/* Galleries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleries.map((gallery) => (
          <div
            key={gallery.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-video">
              <Image
                src={gallery.thumbnail}
                alt={gallery.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-3 right-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    gallery.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {gallery.status}
                </span>
              </div>
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-black/70 text-white rounded-full text-xs font-medium flex items-center">
                  <Grid className="w-3 h-3 mr-1" />
                  {gallery.itemCount} items
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {gallery.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {gallery.description}
                  </p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <Eye className="w-3 h-3 mr-1" />
                    Views
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {(gallery.views / 1000).toFixed(1)}K
                  </p>
                </div>
                <div>
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Clicks
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {gallery.clicks}
                  </p>
                </div>
                <div>
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Revenue
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    ${(gallery.revenue / 1000).toFixed(1)}K
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/content/galleries/${gallery.id}`}
                  className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit
                </Link>
                {gallery.status === 'published' && (
                  <button className="flex-1 text-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Live
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Updated {new Date(gallery.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
