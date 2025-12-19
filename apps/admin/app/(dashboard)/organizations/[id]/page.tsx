'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Users, Megaphone, CreditCard } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  industry: string;
  status: 'active' | 'inactive' | 'suspended';
  website?: string;
  email: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    mrr: number;
  };
  stats: {
    members: number;
    campaigns: number;
    content: number;
    spent: number;
  };
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for development
    setOrg({
      id: orgId,
      name: 'Acme Corp',
      industry: 'Technology',
      status: 'active',
      website: 'https://acme.com',
      email: 'contact@acme.com',
      createdAt: '2024-01-15T10:00:00Z',
      subscription: {
        plan: 'Enterprise',
        status: 'active',
        mrr: 1499,
      },
      stats: {
        members: 12,
        campaigns: 24,
        content: 156,
        spent: 48500,
      },
    });
    setLoading(false);
  }, [orgId]);

  if (loading || !org) {
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
            <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
            <p className="text-gray-600 mt-1">{org.industry}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {org.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Edit
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Suspend
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold">{org.stats.members}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Campaigns</p>
              <p className="text-2xl font-bold">{org.stats.campaigns}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Content</p>
              <p className="text-2xl font-bold">{org.stats.content}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(org.stats.spent)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Organization Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{org.email}</p>
            </div>
            {org.website && (
              <div>
                <p className="text-sm text-gray-600">Website</p>
                <a href={org.website} className="font-medium text-blue-600 hover:underline">
                  {org.website}
                </a>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Industry</p>
              <p className="font-medium">{org.industry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">{formatDate(org.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-medium">{org.subscription.plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                {org.subscription.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">MRR</p>
              <p className="font-medium">{formatCurrency(org.subscription.mrr)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
