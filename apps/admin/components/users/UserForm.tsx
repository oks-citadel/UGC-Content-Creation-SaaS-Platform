'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'brand' | 'creator';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
}

interface UserFormProps {
  user: User;
  onSave: () => void;
}

export function UserForm({ user, onSave }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    status: user.status,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      onSave();
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-6">Edit User</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            id="role"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'brand' | 'creator' })}
          >
            <option value="brand">Brand</option>
            <option value="creator">Creator</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
