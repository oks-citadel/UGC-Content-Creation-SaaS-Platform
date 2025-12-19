'use client'

import { useState } from 'react'
import { Plus, Search, MoreVertical, Mail, Shield, UserX } from 'lucide-react'

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const teamMembers = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@acme.com',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      status: 'active',
      lastActive: '2024-06-18',
      campaigns: 12,
    },
    {
      id: '2',
      name: 'Sarah Williams',
      email: 'sarah@acme.com',
      role: 'Manager',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      status: 'active',
      lastActive: '2024-06-18',
      campaigns: 8,
    },
    {
      id: '3',
      name: 'Michael Brown',
      email: 'michael@acme.com',
      role: 'Member',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      status: 'active',
      lastActive: '2024-06-17',
      campaigns: 5,
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily@acme.com',
      role: 'Member',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      status: 'pending',
      lastActive: null,
      campaigns: 0,
    },
  ]

  const roles = [
    {
      name: 'Admin',
      description: 'Full access to all features and settings',
      permissions: ['Manage campaigns', 'Manage team', 'Manage billing', 'View analytics'],
    },
    {
      name: 'Manager',
      description: 'Can manage campaigns and view analytics',
      permissions: ['Manage campaigns', 'View analytics', 'Manage creators'],
    },
    {
      name: 'Member',
      description: 'Can view campaigns and basic analytics',
      permissions: ['View campaigns', 'View analytics'],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your team members and their permissions
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Members</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{teamMembers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {teamMembers.filter((m) => m.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Pending Invites</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {teamMembers.filter((m) => m.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Admins</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {teamMembers.filter((m) => m.role === 'Admin').length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Campaigns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      <Shield className="w-3 h-3 mr-1" />
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.campaigns} campaigns
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.lastActive
                      ? new Date(member.lastActive).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles & Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Roles & Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary-600" />
                <h4 className="font-semibold text-gray-900">{role.name}</h4>
              </div>
              <p className="text-sm text-gray-500 mb-3">{role.description}</p>
              <ul className="space-y-2">
                {role.permissions.map((permission) => (
                  <li key={permission} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
