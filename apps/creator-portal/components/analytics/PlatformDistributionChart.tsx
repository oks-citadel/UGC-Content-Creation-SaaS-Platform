'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Loader2 } from 'lucide-react';

type PlatformData = {
  name: string;
  value: number;
  color: string;
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E4405F',
  YouTube: '#FF0000',
  TikTok: '#000000',
  Twitter: '#1DA1F2',
  Facebook: '#1877F2',
  LinkedIn: '#0A66C2',
  Other: '#6B7280',
};

export default function PlatformDistributionChart() {
  const [data, setData] = useState<PlatformData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatformData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/analytics/platforms`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch platform data');
        }

        const result = await response.json();
        if (result.data) {
          setData(
            result.data.map((item: any) => ({
              name: item.platform || item.name,
              value: item.reach || item.followers || item.value || 0,
              color: PLATFORM_COLORS[item.platform || item.name] || PLATFORM_COLORS.Other,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch platform data:', err);
        setError('Failed to load platform data');
        setData(generatePlaceholderData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformData();
  }, []);

  const generatePlaceholderData = (): PlatformData[] => {
    return [
      { name: 'Instagram', value: 45200, color: PLATFORM_COLORS.Instagram },
      { name: 'YouTube', value: 32500, color: PLATFORM_COLORS.YouTube },
      { name: 'TikTok', value: 28300, color: PLATFORM_COLORS.TikTok },
      { name: 'Twitter', value: 12100, color: PLATFORM_COLORS.Twitter },
    ];
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500">Loading chart...</span>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      {error && (
        <p className="text-xs text-amber-600 mb-2">
          Using sample data - {error}
        </p>
      )}

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value,
                name,
              ]}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600">
              {item.name}: {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
