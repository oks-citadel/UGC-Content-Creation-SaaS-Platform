'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Flag } from 'lucide-react';

interface ModerationActionsProps {
  contentId: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export function ModerationActions({ contentId, onApprove, onReject }: ModerationActionsProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    await onApprove();
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    setProcessing(true);
    await onReject(rejectReason);
    setProcessing(false);
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Moderation Actions</h2>

        {!showRejectForm ? (
          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Content
            </button>

            <button
              onClick={() => setShowRejectForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              <XCircle className="w-5 h-5" />
              Reject Content
            </button>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50">
              <Flag className="w-5 h-5" />
              Flag for Review
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Provide a reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Moderation Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Check for copyright compliance</li>
          <li>• Verify brand guidelines adherence</li>
          <li>• Ensure content quality standards</li>
          <li>• Review for inappropriate content</li>
          <li>• Validate campaign requirements</li>
        </ul>
      </div>
    </div>
  );
}
