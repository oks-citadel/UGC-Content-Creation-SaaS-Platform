'use client';

import StatsCard from '@/components/dashboard/StatsCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { DollarSign, Briefcase, TrendingUp, Eye } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Earnings',
      value: '$12,450',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'green',
    },
    {
      title: 'Active Campaigns',
      value: '8',
      change: '+2',
      trend: 'up' as const,
      icon: Briefcase,
      color: 'blue',
    },
    {
      title: 'Content Views',
      value: '245K',
      change: '+18.2%',
      trend: 'up' as const,
      icon: Eye,
      color: 'purple',
    },
    {
      title: 'Engagement Rate',
      value: '4.8%',
      change: '+0.3%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart placeholder - integrate with recharts</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Deadlines</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {[
            {
              campaign: 'Summer Fashion Campaign',
              deadline: '2 days',
              status: 'urgent',
            },
            {
              campaign: 'Tech Product Review',
              deadline: '5 days',
              status: 'normal',
            },
            {
              campaign: 'Fitness Challenge Video',
              deadline: '1 week',
              status: 'normal',
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">{item.campaign}</p>
                <p className="text-sm text-gray-600">Due in {item.deadline}</p>
              </div>
              <span
                className={`badge ${
                  item.status === 'urgent'
                    ? 'badge-error'
                    : 'badge-info'
                }`}
              >
                {item.status === 'urgent' ? 'Urgent' : 'Normal'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
