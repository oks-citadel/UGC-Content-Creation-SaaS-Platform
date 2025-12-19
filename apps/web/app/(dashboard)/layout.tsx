'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'HomeIcon' },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: 'MegaphoneIcon' },
  { name: 'Content', href: '/dashboard/content', icon: 'PhotoIcon' },
  { name: 'Creators', href: '/dashboard/creators', icon: 'UsersIcon' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: 'ChartBarIcon' },
  { name: 'Commerce', href: '/dashboard/commerce', icon: 'ShoppingBagIcon' },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: 'CogIcon' },
  { name: 'Help', href: '/dashboard/help', icon: 'QuestionMarkCircleIcon' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600/75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">NEXUS</span>
          </Link>
          <button
            type="button"
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="w-5 h-5">
                    {/* Icon placeholder */}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">John Doe</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">john@example.com</p>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 lg:px-8">
          <button
            type="button"
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex-1">
            {/* Search */}
            <div className="relative max-w-md">
              <input
                type="search"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <span className="sr-only">Notifications</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Create button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Create</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
