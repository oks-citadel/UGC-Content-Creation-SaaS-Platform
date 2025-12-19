'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', revenue: 180000, growth: 165000 },
  { month: 'Feb', revenue: 205000, growth: 185000 },
  { month: 'Mar', revenue: 235000, growth: 205000 },
  { month: 'Apr', revenue: 248000, growth: 225000 },
  { month: 'May', revenue: 265000, growth: 240000 },
  { month: 'Jun', revenue: 284000, growth: 258000 },
];

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Revenue"
        />
        <Line
          type="monotone"
          dataKey="growth"
          stroke="#10b981"
          strokeWidth={2}
          name="Growth Target"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
