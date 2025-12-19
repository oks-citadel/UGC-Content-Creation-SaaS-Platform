'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  Ban,
  CheckCircle,
  AlertCircle,
  Activity,
  CreditCard,
  FileText,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { UserForm } from '@/components/users/UserForm';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'brand' | 'creator';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  createdAt: string;
  lastActive: string;
  organizationId?: string;
  organizationName?: string;
  subscription?: {
    plan: string;
    status: string;
    mrr: number;
  };
  stats: {
    campaigns?: number;
    content?: number;
    spent?: number;
    earned?: number;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Mock data for development
        setUser({
          id: userId,
          email: 'john.doe@example.com',
          name: 'John Doe',
          role: 'brand',
          status: 'active',
          phone: '+1 (555) 123-4567',
          createdAt: '2024-01-15T10:00:00Z',
          lastActive: '2024-03-20T15:30:00Z',
          organizationId: 'org-123',
          organizationName: 'Acme Corp',
          subscription: {
            plan: 'Professional',
            status: 'active',
            mrr: 499,
          },
          stats: {
            campaigns: 12,
            content: 145,
            spent: 24850,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
      });
      setUser(user ? { ...user, status: 'suspended' } : null);
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleActivate = async () => {
    try {
      await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
      });
      setUser(user ? { ...user, status: 'active' } : null);
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </button>
        <UserForm user={user} onSave={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.status === 'active'
                ? 'bg-green-100 text-green-800'
                : user.status === 'suspended'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {user.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Edit
          </button>
          {user.status === 'active' ? (
            <button
              onClick={handleSuspend}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Suspend
            </button>
          ) : (
            <button
              onClick={handleActivate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Activate
            </button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Joined</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Last Active</p>
                  <p className="font-medium">{formatDate(user.lastActive)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
              </div>
              {user.organizationName && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Organization</p>
                    <p className="font-medium">{user.organizationName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {user.stats.campaigns !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">{user.stats.campaigns}</p>
                </div>
              )}
              {user.stats.content !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Content</p>
                  <p className="text-2xl font-bold text-gray-900">{user.stats.content}</p>
                </div>
              )}
              {user.stats.spent !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(user.stats.spent)}
                  </p>
                </div>
              )}
              {user.stats.earned !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(user.stats.earned)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {[
                { action: 'Created campaign', time: '2 hours ago' },
                { action: 'Updated profile', time: '1 day ago' },
                { action: 'Uploaded content', time: '3 days ago' },
                { action: 'Made payment', time: '1 week ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription */}
          {user.subscription && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-medium">{user.subscription.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    <CheckCircle className="w-3 h-3" />
                    {user.subscription.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">MRR</p>
                  <p className="font-medium">{formatCurrency(user.subscription.mrr)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 text-left text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Send Email
              </button>
              <button className="w-full px-4 py-2 text-left text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                View Billing
              </button>
              <button className="w-full px-4 py-2 text-left text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                View Audit Log
              </button>
              <button className="w-full px-4 py-2 text-left text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
