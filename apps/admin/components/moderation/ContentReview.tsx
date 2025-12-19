'use client';

import { useState } from 'react';
import { FileVideo, User, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ContentReviewProps {
  content: {
    id: string;
    title: string;
    creator: string;
    campaign: string;
    status: string;
    submittedAt: string;
    videoUrl: string;
    description: string;
    flags: any[];
  };
}

export function ContentReview({ content }: ContentReviewProps) {
  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
          <FileVideo className="w-16 h-16 text-gray-600" />
          <p className="text-gray-400 ml-4">Video Preview</p>
        </div>
      </div>

      {/* Content Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Content Details</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Title</p>
            <p className="font-medium">{content.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Description</p>
            <p className="text-gray-900">{content.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Creator</p>
              <p className="font-medium">{content.creator}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Campaign</p>
              <p className="font-medium">{content.campaign}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="font-medium">{formatDate(content.submittedAt)}</p>
          </div>
        </div>
      </div>

      {/* Flags */}
      {content.flags && content.flags.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Content Flags</h2>
          <div className="space-y-2">
            {content.flags.map((flag: any, i: number) => (
              <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-900">{flag.type}</p>
                <p className="text-sm text-red-700">{flag.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
