'use client';

import { JobQueue } from '@/components/system/JobQueue';

export default function BackgroundJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Background Jobs</h1>
        <p className="text-gray-600 mt-2">Monitor background job queues and workers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Jobs', value: '12' },
          { label: 'Queued', value: '45' },
          { label: 'Completed Today', value: '1,234' },
          { label: 'Failed', value: '3' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <JobQueue />
    </div>
  );
}
