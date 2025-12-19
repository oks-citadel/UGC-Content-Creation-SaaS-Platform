'use client';

import { Activity, Database, Server, Cloud, CheckCircle, AlertCircle } from 'lucide-react';

interface Service {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: string;
  uptime: string;
  icon: React.ElementType;
}

const services: Service[] = [
  {
    name: 'API Gateway',
    status: 'operational',
    responseTime: '120ms',
    uptime: '99.98%',
    icon: Server,
  },
  {
    name: 'Database',
    status: 'operational',
    responseTime: '45ms',
    uptime: '99.99%',
    icon: Database,
  },
  {
    name: 'Storage Service',
    status: 'operational',
    responseTime: '85ms',
    uptime: '99.95%',
    icon: Cloud,
  },
  {
    name: 'Background Jobs',
    status: 'operational',
    responseTime: 'N/A',
    uptime: '99.92%',
    icon: Activity,
  },
];

export function HealthStatus() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map((service) => {
        const Icon = service.icon;
        const isHealthy = service.status === 'operational';

        return (
          <div
            key={service.name}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-600">Response: {service.responseTime}</p>
                </div>
              </div>
              {isHealthy ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isHealthy ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isHealthy ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {service.status}
                </span>
              </div>
              <span className="text-sm text-gray-600">Uptime: {service.uptime}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
