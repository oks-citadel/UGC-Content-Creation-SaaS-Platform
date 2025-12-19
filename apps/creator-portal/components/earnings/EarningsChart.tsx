'use client';

import { BarChart3 } from 'lucide-react';

export default function EarningsChart() {
  // Mock data - replace with actual chart using recharts
  const monthlyData = [
    { month: 'Jan', earnings: 1200 },
    { month: 'Feb', earnings: 1800 },
    { month: 'Mar', earnings: 2400 },
    { month: 'Apr', earnings: 2100 },
    { month: 'May', earnings: 3200 },
    { month: 'Jun', earnings: 3450 },
  ];

  const maxEarnings = Math.max(...monthlyData.map((d) => d.earnings));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Monthly earnings over the last 6 months</p>
        <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
          <option>Last 6 months</option>
          <option>Last 12 months</option>
          <option>All time</option>
        </select>
      </div>

      {/* Simple bar chart - replace with recharts for production */}
      <div className="h-64 flex items-end gap-4 px-4">
        {monthlyData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '200px' }}>
              <div
                className="w-full bg-primary-600 rounded-t-lg absolute bottom-0 transition-all hover:bg-primary-700"
                style={{ height: `${(data.earnings / maxEarnings) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700">
                  ${(data.earnings / 1000).toFixed(1)}K
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">{data.month}</p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">$3.5K</p>
          <p className="text-sm text-gray-600">Avg Monthly</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">+28%</p>
          <p className="text-sm text-gray-600">Growth Rate</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">6</p>
          <p className="text-sm text-gray-600">Campaigns</p>
        </div>
      </div>
    </div>
  );
}
