'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MoreVertical, Ban, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'brand' | 'creator';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastActive: string;
}

interface UserTableProps {
  filters: {
    search: string;
    status: string;
    role: string;
    dateRange: string;
  };
}

export function UserTable({ filters }: UserTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch users based on filters
    const fetchUsers = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.status !== 'all') params.set('status', filters.status);
        if (filters.role !== 'all') params.set('role', filters.role);

        const response = await fetch(`/api/admin/users?${params}`);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        // Mock data for development
        setUsers([
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'brand',
            status: 'active',
            createdAt: '2024-01-15T10:00:00Z',
            lastActive: '2024-03-20T15:30:00Z',
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'creator',
            status: 'active',
            createdAt: '2024-02-01T10:00:00Z',
            lastActive: '2024-03-19T12:00:00Z',
          },
          {
            id: '3',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            role: 'brand',
            status: 'suspended',
            createdAt: '2024-01-10T10:00:00Z',
            lastActive: '2024-03-15T08:00:00Z',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <Link
                      href={`/users/${user.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {user.name}
                    </Link>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.lastActive)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="p-1 rounded hover:bg-gray-100">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found</p>
        </div>
      )}

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{users.length}</span> of{' '}
          <span className="font-medium">{users.length}</span> results
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
            Previous
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
