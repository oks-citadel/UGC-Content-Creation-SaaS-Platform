'use client';

import { FileText, Download } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    { name: 'Monthly Revenue Report', type: 'Financial', lastGenerated: '2024-03-01' },
    { name: 'User Activity Report', type: 'Analytics', lastGenerated: '2024-03-15' },
    { name: 'Content Performance', type: 'Analytics', lastGenerated: '2024-03-10' },
    { name: 'Compliance Report', type: 'Legal', lastGenerated: '2024-03-01' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">Generate and download system reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Available Reports', value: '12' },
          { label: 'Generated This Month', value: '45' },
          { label: 'Scheduled Reports', value: '8' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
        <div className="space-y-3">
          {reports.map((report, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{report.name}</p>
                  <p className="text-sm text-gray-600">{report.type} • Last generated: {report.lastGenerated}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Generate
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
