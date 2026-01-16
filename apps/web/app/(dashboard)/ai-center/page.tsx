'use client';

import { useState } from 'react';
import Link from 'next/link';

const stats = [
  { name: 'AI Requests Today', value: '2,847', change: '+12.5%', changeType: 'positive' },
  { name: 'Tokens Used', value: '1.2M', change: '+8.3%', changeType: 'positive' },
  { name: 'Avg Response Time', value: '1.2s', change: '-15%', changeType: 'positive' },
  { name: 'Success Rate', value: '99.8%', change: '+0.2%', changeType: 'positive' },
];

const aiAgents = [
  {
    id: 'marketing',
    name: 'Marketing Agent',
    description: 'Build campaigns, flows, and segments with natural language',
    icon: '📣',
    color: 'indigo',
    href: '/dashboard/ai-center/marketing-agent',
    features: ['Campaign Builder', 'Flow Builder', 'Segment Builder'],
    status: 'active',
  },
  {
    id: 'customer',
    name: 'Customer Agent',
    description: 'AI-powered support and sales assistance',
    icon: '💬',
    color: 'emerald',
    href: '/dashboard/ai-center/customer-agent',
    features: ['Support Chat', 'Sales Assistant', 'Human Handoff'],
    status: 'active',
  },
  {
    id: 'content',
    name: 'Content AI',
    description: 'Generate scripts, captions, voiceovers, and videos',
    icon: '🎬',
    color: 'purple',
    href: '/dashboard/ai-center/content-ai',
    features: ['Script Generator', 'Caption Generator', 'Voiceover', 'Video Generator'],
    status: 'active',
  },
  {
    id: 'analytics',
    name: 'Analytics AI',
    description: 'Predict performance and discover trends',
    icon: '📊',
    color: 'amber',
    href: '/dashboard/ai-center/analytics-ai',
    features: ['Performance Predictor', 'Trend Analysis', 'Recommendations'],
    status: 'active',
  },
];

const recentActivity = [
  { id: 1, agent: 'Marketing Agent', action: 'Generated campaign for Summer Sale', time: '5 min ago' },
  { id: 2, agent: 'Content AI', action: 'Created 3 video scripts', time: '12 min ago' },
  { id: 3, agent: 'Customer Agent', action: 'Resolved 15 support tickets', time: '1 hour ago' },
  { id: 4, agent: 'Analytics AI', action: 'Predicted Q1 performance trends', time: '2 hours ago' },
];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

export default function AICenterPage() {
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month'>('today');

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Your AI-powered marketing command center
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['today', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === period
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Agents grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiAgents.map((agent) => {
            const colors = colorClasses[agent.color];
            return (
              <Link
                key={agent.id}
                href={agent.href}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border ${colors.border} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-2xl`}>
                    {agent.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{agent.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {agent.features.map((feature) => (
                        <span
                          key={feature}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.agent}</p>
              </div>
              <span className="text-sm text-gray-400 dark:text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Credits */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">AI Credits</h3>
            <p className="text-indigo-100 mt-1">8,500 / 10,000 credits remaining this month</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">85%</p>
            <p className="text-indigo-100 text-sm">Available</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: '85%' }} />
        </div>
      </div>
    </div>
  );
}
