'use client';

import { CheckCircle, Clock, AlertCircle, Upload } from 'lucide-react';

interface Deliverable {
  id: string;
  type: string;
  description: string;
  dueDate: string;
  status: string;
  submittedDate?: string;
}

interface DeliverableListProps {
  deliverables: Deliverable[];
  campaignId: string;
}

export default function DeliverableList({
  deliverables,
  campaignId,
}: DeliverableListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-review':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'in-review':
        return 'badge-warning';
      case 'pending':
        return 'badge-info';
      default:
        return 'badge-info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-review':
        return 'In Review';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {deliverables.map((deliverable) => (
        <div
          key={deliverable.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="mt-1">{getStatusIcon(deliverable.status)}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {deliverable.type}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {deliverable.description}
                  </p>
                </div>
                <span className={`badge ${getStatusBadge(deliverable.status)}`}>
                  {getStatusText(deliverable.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>Due: {deliverable.dueDate}</span>
                {deliverable.submittedDate && (
                  <span>Submitted: {deliverable.submittedDate}</span>
                )}
              </div>

              {deliverable.status === 'pending' && (
                <button className="btn btn-primary text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Content
                </button>
              )}

              {deliverable.status === 'in-review' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  Your content is being reviewed by the brand
                </div>
              )}

              {deliverable.status === 'completed' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  Approved and published
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
