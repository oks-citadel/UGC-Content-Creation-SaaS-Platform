'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface Activity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: string;
}

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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Fetch recent activity from notification/activity service
  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/activity/recent?limit=10');
      if (response.ok) {
        const data = await response.json();
        const activityList = data.data || data.activities || [];

        // Transform activity data to consistent format
        const formattedActivities: Activity[] = activityList.map((item: any) => ({
          id: item.id || item._id || Math.random().toString(),
          action: item.action || item.type || item.message || 'Activity',
          user: item.user || item.actor || item.subject || 'Unknown',
          time: formatRelativeTime(item.createdAt || item.timestamp || new Date().toISOString()),
          type: item.activityType || item.category || 'general',
        }));

        setActivities(formattedActivities);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  useEffect(() => {
    // Fetch dashboard stats from analytics and other services
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel from their respective services
        const [
          userStatsRes,
          orgStatsRes,
          creatorStatsRes,
          contentStatsRes,
          revenueStatsRes,
          healthStatsRes,
        ] = await Promise.allSettled([
          fetch('/api/admin/users/stats'),
          fetch('/api/admin/organizations/stats'),
          fetch('/api/admin/creators/stats'),
          fetch('/api/admin/content/stats'),
          fetch('/api/admin/billing/revenue'),
          fetch('/api/admin/system/health'),
        ]);

        // Helper to safely extract data from response
        const extractData = async (result: PromiseSettledResult<Response>, defaultValue: any) => {
          if (result.status === 'fulfilled' && result.value.ok) {
            const json = await result.value.json();
            return json.data || json;
          }
          return defaultValue;
        };

        // Extract data from each response with defaults
        const [userData, orgData, creatorData, contentData, revenueData, healthData] = await Promise.all([
          extractData(userStatsRes, { total: 0, active: 0, growth: 0 }),
          extractData(orgStatsRes, { total: 0, active: 0, growth: 0 }),
          extractData(creatorStatsRes, { total: 0, verified: 0, growth: 0 }),
          extractData(contentStatsRes, { total: 0, pending: 0, growth: 0 }),
          extractData(revenueStatsRes, { mrr: 0, arr: 0, growth: 0 }),
          extractData(healthStatsRes, { status: 'unknown', uptime: 0 }),
        ]);

        setStats({
          users: {
            total: userData.total ?? userData.totalUsers ?? 0,
            active: userData.active ?? userData.activeUsers ?? 0,
            growth: userData.growth ?? userData.growthRate ?? 0,
          },
          organizations: {
            total: orgData.total ?? orgData.totalOrganizations ?? 0,
            active: orgData.active ?? orgData.activeOrganizations ?? 0,
            growth: orgData.growth ?? orgData.growthRate ?? 0,
          },
          creators: {
            total: creatorData.total ?? creatorData.totalCreators ?? 0,
            verified: creatorData.verified ?? creatorData.verifiedCreators ?? 0,
            growth: creatorData.growth ?? creatorData.growthRate ?? 0,
          },
          content: {
            total: contentData.total ?? contentData.totalContent ?? 0,
            pending: contentData.pending ?? contentData.pendingReview ?? 0,
            growth: contentData.growth ?? contentData.growthRate ?? 0,
          },
          revenue: {
            mrr: revenueData.mrr ?? revenueData.monthlyRecurringRevenue ?? 0,
            arr: revenueData.arr ?? revenueData.annualRecurringRevenue ?? 0,
            growth: revenueData.growth ?? revenueData.growthRate ?? 0,
          },
          health: {
            status: healthData.status ?? 'unknown',
            uptime: healthData.uptime ?? healthData.uptimePercentage ?? 0,
          },
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Show error state - don't use mock data in production
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchRecentActivity();

    // Refresh stats every 60 seconds
    const statsIntervalId = setInterval(fetchStats, 60000);
    // Refresh activity every 30 seconds
    const activityIntervalId = setInterval(fetchRecentActivity, 30000);

    return () => {
      clearInterval(statsIntervalId);
      clearInterval(activityIntervalId);
    };
  }, [fetchRecentActivity]);

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
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.user}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
