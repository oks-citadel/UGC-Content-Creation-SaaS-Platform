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
  Legend,
} from 'recharts';
import { Loader2 } from 'lucide-react';

type EngagementData = {
  date: string;
  likes: number;
  comments: number;
  shares: number;
};

type TimeRange = '7d' | '30d' | '90d';

export default function EngagementChart() {
  const [data, setData] = useState<EngagementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    const fetchEngagementData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/analytics/engagement?range=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch engagement data');
        }

        const result = await response.json();
        if (result.data) {
          setData(
            result.data.map((item: any) => ({
              date: new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              likes: item.likes || 0,
              comments: item.comments || 0,
              shares: item.shares || 0,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch engagement data:', err);
        setError('Failed to load engagement data');
        setData(generatePlaceholderData(timeRange));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEngagementData();
  }, [timeRange]);

  const generatePlaceholderData = (range: TimeRange): EngagementData[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data: EngagementData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        likes: Math.floor(Math.random() * 500) + 100,
        comments: Math.floor(Math.random() * 100) + 20,
        shares: Math.floor(Math.random() * 50) + 10,
      });
    }
    return data;
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500">Loading chart...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
        {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeRange === range
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-amber-600 mb-2">
          Using sample data - {error}
        </p>
      )}

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={timeRange === '90d' ? 14 : timeRange === '30d' ? 6 : 0}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            <Bar dataKey="likes" fill="#ec4899" name="Likes" radius={[4, 4, 0, 0]} />
            <Bar dataKey="comments" fill="#10b981" name="Comments" radius={[4, 4, 0, 0]} />
            <Bar dataKey="shares" fill="#3b82f6" name="Shares" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
