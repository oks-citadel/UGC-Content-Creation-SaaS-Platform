'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';

type EarningsData = {
  month: string;
  earnings: number;
};

type TimeRange = '6m' | '12m' | 'all';

export default function EarningsChart() {
  const [data, setData] = useState<EarningsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');
  const [stats, setStats] = useState({
    avgMonthly: 0,
    growthRate: 0,
    totalCampaigns: 0,
  });

  useEffect(() => {
    const fetchEarningsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/analytics/earnings?range=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch earnings data');
        }

        const result = await response.json();
        if (result.data) {
          const chartData = result.data.map((item: any) => ({
            month: new Date(item.date || item.month).toLocaleDateString('en-US', {
              month: 'short',
            }),
            earnings: item.earnings || item.amount || 0,
          }));
          setData(chartData);

          const total = chartData.reduce((sum: number, d: EarningsData) => sum + d.earnings, 0);
          const avg = chartData.length > 0 ? total / chartData.length : 0;
          const growth = chartData.length >= 2
            ? ((chartData[chartData.length - 1].earnings - chartData[0].earnings) / chartData[0].earnings) * 100
            : 0;

          setStats({
            avgMonthly: avg,
            growthRate: growth,
            totalCampaigns: result.totalCampaigns || chartData.length,
          });
        }
      } catch (err) {
        console.error('Failed to fetch earnings data:', err);
        setError('Failed to load earnings data');
        const placeholderData = generatePlaceholderData(timeRange);
        setData(placeholderData);

        const total = placeholderData.reduce((sum, d) => sum + d.earnings, 0);
        setStats({
          avgMonthly: total / placeholderData.length,
          growthRate: 28,
          totalCampaigns: 6,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarningsData();
  }, [timeRange]);

  const generatePlaceholderData = (range: TimeRange): EarningsData[] => {
    const months = range === '6m' ? 6 : range === '12m' ? 12 : 24;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: EarningsData[] = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      data.push({
        month: monthNames[date.getMonth()],
        earnings: Math.floor(Math.random() * 2000) + 1000,
      });
    }
    return data;
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500">Loading earnings data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {error ? 'Sample earnings data' : 'Monthly earnings over time'}
        </p>
        <div className="flex gap-1">
          {(['6m', '12m', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === '6m' ? '6 months' : range === '12m' ? '12 months' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-amber-600">Using sample data - {error}</p>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Earnings']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
            <Bar
              dataKey="earnings"
              fill="#7c3aed"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-4 border-t grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            ${(stats.avgMonthly / 1000).toFixed(1)}K
          </p>
          <p className="text-sm text-gray-600">Avg Monthly</p>
        </div>
        <div>
          <p className={`text-2xl font-bold ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(0)}%
          </p>
          <p className="text-sm text-gray-600">Growth Rate</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
          <p className="text-sm text-gray-600">Campaigns</p>
        </div>
      </div>
    </div>
  );
}
