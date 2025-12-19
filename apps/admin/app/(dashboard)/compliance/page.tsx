'use client';

import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor legal compliance and rights management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Disputes', value: '3', icon: AlertTriangle, color: 'red' },
          { label: 'Pending Rights', value: '12', icon: Shield, color: 'yellow' },
          { label: 'Resolved This Month', value: '45', icon: CheckCircle, color: 'green' },
          { label: 'Compliance Score', value: '98%', icon: Shield, color: 'blue' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <stat.icon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Disputes</h2>
          <div className="space-y-3">
            {[
              { id: 'D-001', type: 'Copyright', status: 'investigating' },
              { id: 'D-002', type: 'Rights', status: 'pending' },
              { id: 'D-003', type: 'Content', status: 'resolved' },
            ].map((dispute) => (
              <div key={dispute.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{dispute.id}</p>
                  <p className="text-sm text-gray-600">{dispute.type}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  dispute.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {dispute.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Compliance Metrics</h2>
          <div className="space-y-4">
            {[
              { metric: 'GDPR Compliance', score: 100 },
              { metric: 'CCPA Compliance', score: 98 },
              { metric: 'Copyright Verification', score: 95 },
              { metric: 'Terms Compliance', score: 99 },
            ].map((item) => (
              <div key={item.metric}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{item.metric}</span>
                  <span className="text-sm text-gray-600">{item.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
