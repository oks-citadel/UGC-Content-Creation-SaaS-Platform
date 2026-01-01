'use client'

import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  MapPin,
  Users,
  TrendingUp,
  Star,
  Instagram,
  Youtube,
  Video,
  CheckCircle,
  Mail,
  MessageCircle,
  Bookmark
} from 'lucide-react'

export default function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const creator = {
    id,
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    coverImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200',
    bio: 'Fashion and lifestyle content creator based in LA. Passionate about sustainable fashion and helping brands connect with conscious consumers.',
    followers: 125000,
    engagement: 4.8,
    niche: 'Fashion & Lifestyle',
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    location: 'Los Angeles, CA',
    rating: 4.9,
    completedCampaigns: 45,
    avgCost: 1200,
    verified: true,
    languages: ['English', 'Spanish'],
    categories: ['Fashion', 'Beauty', 'Lifestyle', 'Sustainability'],
  }

  const platformStats = [
    { platform: 'Instagram', icon: Instagram, followers: 85000, engagement: 5.2 },
    { platform: 'TikTok', icon: Video, followers: 32000, engagement: 6.8 },
    { platform: 'YouTube', icon: Youtube, followers: 8000, engagement: 3.4 },
  ]

  const portfolio = [
    { id: 1, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', views: 52300, likes: 2100 },
    { id: 2, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400', views: 48900, likes: 1850 },
    { id: 3, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', views: 61200, likes: 2650 },
    { id: 4, image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', views: 39400, likes: 1420 },
    { id: 5, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', views: 55600, likes: 2280 },
    { id: 6, image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400', views: 72100, likes: 3150 },
  ]

  const reviews = [
    {
      id: 1,
      brand: 'Fashion Forward Inc.',
      rating: 5,
      comment: 'Amazing to work with! Professional, creative, and delivered exceptional content.',
      date: '2024-05-15',
    },
    {
      id: 2,
      brand: 'Eco Style Co.',
      rating: 5,
      comment: 'Sarah perfectly captured our brand values. Highly recommend!',
      date: '2024-04-22',
    },
    {
      id: 3,
      brand: 'Urban Threads',
      rating: 4,
      comment: 'Great content and engagement. Would work with again.',
      date: '2024-03-10',
    },
  ]

  return (
    <div className="space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Marketplace
      </Link>

      {/* Cover and Profile */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="relative h-64">
          <Image
            src={creator.coverImage}
            alt="Cover"
            fill
            className="object-cover"
          />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-6 -mt-16 relative">
            <div className="relative">
              <Image
                src={creator.avatar}
                alt={creator.name}
                width={128}
                height={128}
                className="rounded-full border-4 border-white object-cover"
              />
              {creator.verified && (
                <div className="absolute bottom-2 right-2 bg-primary-500 rounded-full p-1">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 sm:mt-16">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    {creator.name}
                  </h1>
                  <p className="text-gray-600 mt-1">{creator.niche}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {creator.location}
                    </span>
                    <span className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400 fill-yellow-400" />
                      {creator.rating} ({creator.completedCampaigns} campaigns)
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Bookmark className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Invite to Campaign
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-gray-700">{creator.bio}</p>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mt-4">
            {creator.categories.map((category) => (
              <span
                key={category}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Reach</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {creator.followers.toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{creator.engagement}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${creator.avgCost}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{creator.completedCampaigns}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platformStats.map((stat) => (
            <div key={stat.platform} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg">
                <stat.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{stat.platform}</p>
                <p className="text-xs text-gray-500">{stat.followers.toLocaleString()} followers</p>
                <p className="text-xs text-green-600">{stat.engagement}% engagement</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {portfolio.map((item) => (
            <div key={item.id} className="relative group cursor-pointer aspect-square">
              <Image
                src={item.image}
                alt={`Portfolio ${item.id}`}
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <div className="absolute bottom-3 left-3 right-3 text-white text-sm">
                  <div className="flex items-center justify-between">
                    <span>{item.views.toLocaleString()} views</span>
                    <span>{item.likes.toLocaleString()} likes</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews from Brands</h2>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{review.brand}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
