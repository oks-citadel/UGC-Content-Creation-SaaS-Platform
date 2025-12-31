'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Loader2 } from 'lucide-react';

type PerformanceData = {
  date: string;
  views: number;
  engagements: number;
  earnings: number;
};

type TimeRange = '7d' | '30d' | '90d';

export default function PerformanceChart() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/analytics/performance?range=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch performance data');
        }

        const result = await response.json();
        if (result.data) {
          setData(
            result.data.map((item: any) => ({
              date: new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              views: item.views || 0,
              engagements: item.engagements || 0,
              earnings: item.earnings || 0,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch performance data:', err);
        setError('Failed to load performance data');
        // Generate placeholder data for graceful degradation
        setData(generatePlaceholderData(timeRange));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, [timeRange]);

  const generatePlaceholderData = (range: TimeRange): PerformanceData[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data: PerformanceData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: Math.floor(Math.random() * 5000) + 1000,
        engagements: Math.floor(Math.random() * 500) + 100,
        earnings: Math.floor(Math.random() * 200) + 50,
      });
    }
    return data;
  };

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500">Loading chart...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Time Range Selector */}
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

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
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
              formatter={(value: number, name: string) => {
                if (name === 'earnings') {
                  return [`$${value.toFixed(2)}`, 'Earnings'];
                }
                return [value.toLocaleString(), name.charAt(0).toUpperCase() + name.slice(1)];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="Views"
            />
            <Line
              type="monotone"
              dataKey="engagements"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="Engagements"
            />
            <Line
              type="monotone"
              dataKey="earnings"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="Earnings ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
