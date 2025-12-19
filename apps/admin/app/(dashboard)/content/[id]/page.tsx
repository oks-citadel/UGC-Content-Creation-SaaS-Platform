'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Flag } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ContentReview } from '@/components/moderation/ContentReview';
import { ModerationActions } from '@/components/moderation/ModerationActions';

export default function ContentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setContent({
      id: contentId,
      title: 'Product Review Video',
      creator: 'Sarah Johnson',
      campaign: 'Summer Campaign 2024',
      status: 'pending',
      submittedAt: '2024-03-20T10:00:00Z',
      videoUrl: 'https://example.com/video.mp4',
      description: 'Amazing product showcase featuring the latest collection',
      flags: [],
    });
    setLoading(false);
  }, [contentId]);

  const handleApprove = async () => {
    await fetch(`/api/admin/content/${contentId}/approve`, { method: 'POST' });
    router.push('/content');
  };

  const handleReject = async (reason: string) => {
    await fetch(`/api/admin/content/${contentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    router.push('/content');
  };

  if (loading || !content) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Review</h1>
          <p className="text-gray-600 mt-1">{content.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContentReview content={content} />
        </div>
        <div>
          <ModerationActions
            contentId={contentId}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </div>
    </div>
  );
}
