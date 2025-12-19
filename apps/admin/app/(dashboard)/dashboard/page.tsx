'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  UserCheck,
  FileVideo,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { HealthStatus } from '@/components/system/HealthStatus';
import { RevenueChart } from '@/components/billing/RevenueChart';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    growth: number;
  };
  organizations: {
    total: number;
    active: number;
    growth: number;
  };
  creators: {
    total: number;
    verified: number;
    growth: number;
  };
  content: {
    total: number;
    pending: number;
    growth: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    growth: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
  };
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        )}
        <span
          className={`text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isPositive ? '+' : ''}
          {change}%
        </span>
        <span className="text-sm text-gray-600">vs last month</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Set mock data for development
        setStats({
          users: { total: 15420, active: 12340, growth: 12.5 },
          organizations: { total: 1240, active: 980, growth: 8.3 },
          creators: { total: 8920, verified: 6540, growth: 15.7 },
          content: { total: 45230, pending: 120, growth: 22.4 },
          revenue: { mrr: 284000, arr: 3408000, growth: 18.2 },
          health: { status: 'healthy', uptime: 99.98 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and key metrics</p>
      </div>

      {/* System Health Alert */}
      {stats.health.status !== 'healthy' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900">System Status: {stats.health.status}</h3>
            <p className="text-sm text-amber-800 mt-1">
              Some services are experiencing issues. Check the System Health page for details.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={formatNumber(stats.users.total)}
          change={stats.users.growth}
          icon={Users}
          subtitle={`${formatNumber(stats.users.active)} active`}
        />
        <StatCard
          title="Organizations"
          value={formatNumber(stats.organizations.total)}
          change={stats.organizations.growth}
          icon={Building2}
          subtitle={`${formatNumber(stats.organizations.active)} active`}
        />
        <StatCard
          title="Creators"
          value={formatNumber(stats.creators.total)}
          change={stats.creators.growth}
          icon={UserCheck}
          subtitle={`${formatNumber(stats.creators.verified)} verified`}
        />
        <StatCard
          title="Content Items"
          value={formatNumber(stats.content.total)}
          change={stats.content.growth}
          icon={FileVideo}
          subtitle={`${formatNumber(stats.content.pending)} pending review`}
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(stats.revenue.mrr)}
          change={stats.revenue.growth}
          icon={DollarSign}
          subtitle={`${formatCurrency(stats.revenue.arr)} ARR`}
        />
        <StatCard
          title="System Uptime"
          value={`${stats.health.uptime}%`}
          change={0}
          icon={Activity}
          subtitle={stats.health.status}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenue Overview</h2>
        <RevenueChart />
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">System Health</h2>
        <HealthStatus />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[
            {
              action: 'New organization created',
              user: 'Acme Corp',
              time: '5 minutes ago',
            },
            {
              action: 'Creator verified',
              user: 'Sarah Johnson',
              time: '12 minutes ago',
            },
            {
              action: 'Content approved',
              user: 'Campaign #1234',
              time: '23 minutes ago',
            },
            {
              action: 'Payout processed',
              user: '$12,450.00',
              time: '1 hour ago',
            },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.user}</p>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
