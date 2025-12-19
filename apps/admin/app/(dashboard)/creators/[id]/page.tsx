'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Shield } from 'lucide-react';
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils';

interface Creator {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  status: 'active' | 'pending' | 'suspended';
  bio: string;
  followers: number;
  content: number;
  earnings: number;
  joinedAt: string;
  verificationDocuments?: {
    id: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    url: string;
  }[];
}

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setCreator({
      id: creatorId,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      verified: false,
      status: 'pending',
      bio: 'Fashion and lifestyle content creator',
      followers: 125000,
      content: 48,
      earnings: 12450,
      joinedAt: '2024-01-15T10:00:00Z',
      verificationDocuments: [
        {
          id: '1',
          type: 'Government ID',
          status: 'pending',
          url: '/docs/id.pdf',
        },
        {
          id: '2',
          type: 'Portfolio',
          status: 'pending',
          url: '/docs/portfolio.pdf',
        },
      ],
    });
    setLoading(false);
  }, [creatorId]);

  const handleVerify = async () => {
    if (!confirm('Verify this creator?')) return;
    // API call to verify
    setCreator(creator ? { ...creator, verified: true, status: 'active' } : null);
  };

  const handleReject = async () => {
    if (!confirm('Reject this creator verification?')) return;
    // API call to reject
  };

  if (loading || !creator) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{creator.name}</h1>
              {creator.verified && <CheckCircle className="w-6 h-6 text-green-600" />}
            </div>
            <p className="text-gray-600 mt-1">{creator.email}</p>
          </div>
        </div>
        {!creator.verified && creator.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              Reject
            </button>
            <button
              onClick={handleVerify}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Verify Creator
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Followers</p>
          <p className="text-2xl font-bold">{formatNumber(creator.followers)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Content Items</p>
          <p className="text-2xl font-bold">{creator.content}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Total Earnings</p>
          <p className="text-2xl font-bold">{formatCurrency(creator.earnings)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Member Since</p>
          <p className="text-2xl font-bold">{formatDate(creator.joinedAt).split(',')[0]}</p>
        </div>
      </div>

      {/* Verification Documents */}
      {creator.verificationDocuments && creator.verificationDocuments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Verification Documents</h2>
          <div className="space-y-3">
            {creator.verificationDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium">{doc.type}</p>
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      doc.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : doc.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  View Document
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Bio</h2>
        <p className="text-gray-700">{creator.bio}</p>
      </div>
    </div>
  );
}
