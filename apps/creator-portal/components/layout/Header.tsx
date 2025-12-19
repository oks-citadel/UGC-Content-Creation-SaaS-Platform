'use client';

import { Bell, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6 lg:px-8">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns, opportunities..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Search className="h-5 w-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
          </button>

          {/* Quick Actions */}
          <div className="hidden md:block">
            <button className="btn btn-primary text-sm">
              New Content
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
