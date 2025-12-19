'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, UserPlus, MoreVertical } from 'lucide-react';
import { UserTable } from '@/components/users/UserTable';
import { formatNumber } from '@/lib/utils';

interface UserFilters {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'suspended';
  role: 'all' | 'brand' | 'creator';
  dateRange: string;
}

export default function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    role: 'all',
    dateRange: 'all',
  });

  const [stats, setStats] = useState({
    total: 15420,
    active: 12340,
    inactive: 2580,
    suspended: 500,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all platform users</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: stats.total, color: 'blue' },
          { label: 'Active', value: stats.active, color: 'green' },
          { label: 'Inactive', value: stats.inactive, color: 'gray' },
          { label: 'Suspended', value: stats.suspended, color: 'red' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatNumber(stat.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Status Filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Role Filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value as any })}
          >
            <option value="all">All Roles</option>
            <option value="brand">Brand</option>
            <option value="creator">Creator</option>
          </select>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <UserTable filters={filters} />
    </div>
  );
}
