'use client'

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export function MetricsChart({ type = 'line' }: { type?: 'line' | 'bar' | 'pie' }) {
  const lineData = [
    { name: 'Mon', impressions: 4000, engagement: 2400, clicks: 1200 },
    { name: 'Tue', impressions: 3000, engagement: 1398, clicks: 980 },
    { name: 'Wed', impressions: 2000, engagement: 9800, clicks: 1890 },
    { name: 'Thu', impressions: 2780, engagement: 3908, clicks: 2100 },
    { name: 'Fri', impressions: 1890, engagement: 4800, clicks: 2290 },
    { name: 'Sat', impressions: 2390, engagement: 3800, clicks: 2500 },
    { name: 'Sun', impressions: 3490, engagement: 4300, clicks: 2800 },
  ]

  const barData = [
    { name: 'Instagram', value: 4000 },
    { name: 'TikTok', value: 3000 },
    { name: 'YouTube', value: 2000 },
    { name: 'Facebook', value: 1500 },
  ]

  const pieData = [
    { name: 'Instagram', value: 45 },
    { name: 'TikTok', value: 30 },
    { name: 'YouTube', value: 15 },
    { name: 'Facebook', value: 10 },
  ]

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lineData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="impressions"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return null
}
