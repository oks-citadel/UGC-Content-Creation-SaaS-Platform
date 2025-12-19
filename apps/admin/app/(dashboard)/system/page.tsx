'use client';

import { Activity, Database, Server, Cpu } from 'lucide-react';
import { HealthStatus } from '@/components/system/HealthStatus';

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
        <p className="text-gray-600 mt-2">Monitor system performance and health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'API Uptime', value: '99.98%', icon: Server, status: 'healthy' },
          { label: 'Database', value: 'Healthy', icon: Database, status: 'healthy' },
          { label: 'CPU Usage', value: '45%', icon: Cpu, status: 'healthy' },
          { label: 'Active Users', value: '1,234', icon: Activity, status: 'healthy' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <stat.icon className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Operational</span>
            </div>
          </div>
        ))}
      </div>

      <HealthStatus />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Service Status</h2>
          <div className="space-y-3">
            {[
              { service: 'API Gateway', status: 'operational', uptime: '99.98%' },
              { service: 'Database', status: 'operational', uptime: '99.99%' },
              { service: 'Storage', status: 'operational', uptime: '99.95%' },
              { service: 'CDN', status: 'operational', uptime: '99.97%' },
              { service: 'Email Service', status: 'operational', uptime: '99.92%' },
            ].map((item) => (
              <div key={item.service} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">{item.service}</span>
                </div>
                <span className="text-sm text-gray-600">{item.uptime}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            {[
              { metric: 'Response Time', value: '120ms', target: '< 200ms' },
              { metric: 'Error Rate', value: '0.02%', target: '< 0.1%' },
              { metric: 'Throughput', value: '1.2k req/s', target: '> 1k req/s' },
              { metric: 'Memory Usage', value: '68%', target: '< 80%' },
            ].map((item) => (
              <div key={item.metric} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.metric}</p>
                  <p className="text-sm text-gray-600">Target: {item.target}</p>
                </div>
                <span className="text-lg font-bold text-green-600">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
