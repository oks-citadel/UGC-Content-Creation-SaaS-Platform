'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Job {
  id: string;
  type: string;
  status: 'active' | 'completed' | 'failed' | 'queued';
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export function JobQueue() {
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: '1',
      type: 'Email Notification Batch',
      status: 'active',
      progress: 65,
      startedAt: '2024-03-20T15:30:00Z',
    },
    {
      id: '2',
      type: 'Content Processing',
      status: 'completed',
      progress: 100,
      startedAt: '2024-03-20T15:20:00Z',
      completedAt: '2024-03-20T15:25:00Z',
    },
    {
      id: '3',
      type: 'Revenue Report Generation',
      status: 'queued',
    },
    {
      id: '4',
      type: 'Payout Processing',
      status: 'failed',
      startedAt: '2024-03-20T15:10:00Z',
      completedAt: '2024-03-20T15:12:00Z',
      error: 'Payment gateway timeout',
    },
  ]);

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'active':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'queued':
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'queued':
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Job Queue</h2>

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                {getStatusIcon(job.status)}
                <div>
                  <h3 className="font-medium text-gray-900">{job.type}</h3>
                  {job.startedAt && (
                    <p className="text-sm text-gray-600">
                      Started: {formatDateTime(job.startedAt)}
                    </p>
                  )}
                  {job.error && (
                    <p className="text-sm text-red-600 mt-1">Error: {job.error}</p>
                  )}
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  job.status
                )}`}
              >
                {job.status}
              </span>
            </div>

            {job.status === 'active' && job.progress !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-medium">{job.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            )}

            {job.completedAt && (
              <p className="text-sm text-gray-600 mt-2">
                Completed: {formatDateTime(job.completedAt)}
              </p>
            )}
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No jobs in queue</p>
        </div>
      )}
    </div>
  );
}
