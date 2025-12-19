'use client';

import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

export default function AnalyticsPage() {
  const metrics = [
    {
      label: 'Total Reach',
      value: '245.3K',
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
      color: 'blue',
    },
    {
      label: 'Engagement Rate',
      value: '4.8%',
      change: '+0.3%',
      trend: 'up',
      icon: Heart,
      color: 'red',
    },
    {
      label: 'Total Likes',
      value: '38.2K',
      change: '+18.2%',
      trend: 'up',
      icon: Heart,
      color: 'pink',
    },
    {
      label: 'Comments',
      value: '2.1K',
      change: '+5.7%',
      trend: 'up',
      icon: MessageCircle,
      color: 'green',
    },
  ];

  const topContent = [
    {
      title: 'Summer Beach Fashion',
      platform: 'Instagram',
      reach: '45.2K',
      engagement: '5.2%',
      likes: '2.3K',
      date: '2024-06-10',
    },
    {
      title: 'Tech Review: Latest Gadget',
      platform: 'YouTube',
      reach: '38.5K',
      engagement: '6.1%',
      likes: '2.1K',
      date: '2024-06-08',
    },
    {
      title: 'Fitness Routine Tutorial',
      platform: 'TikTok',
      reach: '52.1K',
      engagement: '7.3%',
      likes: '3.8K',
      date: '2024-06-05',
    },
  ];

  const platformStats = [
    { platform: 'Instagram', followers: '45.2K', engagement: '4.8%' },
    { platform: 'YouTube', followers: '32.5K', engagement: '5.2%' },
    { platform: 'TikTok', followers: '28.3K', engagement: '6.1%' },
    { platform: 'Twitter', followers: '12.1K', engagement: '3.2%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Analytics
        </h1>
        <p className="text-gray-600 mt-1">
          Track your performance across all platforms
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['7 Days', '30 Days', '90 Days', 'All Time'].map((period) => (
          <button
            key={period}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 whitespace-nowrap"
          >
            {period}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{metric.label}</span>
              <metric.icon className={`h-5 w-5 text-${metric.color}-600`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {metric.value}
              </span>
              <span
                className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Engagement Over Time</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <BarChart3 className="h-12 w-12 text-gray-400" />
            <p className="text-gray-500 ml-3">Chart placeholder - integrate with recharts</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Platform Distribution</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <TrendingUp className="h-12 w-12 text-gray-400" />
            <p className="text-gray-500 ml-3">Chart placeholder - integrate with recharts</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Platform Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformStats.map((stat, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 mb-3">
                {stat.platform}
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Followers</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stat.followers}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Engagement</p>
                  <p className="text-lg font-bold text-primary-600">
                    {stat.engagement}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Top Performing Content</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Content
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Platform
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Reach
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Engagement
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Likes
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {topContent.map((content, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {content.title}
                  </td>
                  <td className="py-3 px-4">
                    <span className="badge badge-info">{content.platform}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {content.reach}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-primary-600">
                    {content.engagement}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {content.likes}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {content.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
