'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Image as ImageIcon,
  DollarSign,
  CreditCard,
  Video,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portfolio', href: '/portfolio', icon: ImageIcon },
  { name: 'Opportunities', href: '/opportunities', icon: Briefcase },
  { name: 'Campaigns', href: '/campaigns', icon: Video },
  { name: 'Earnings', href: '/earnings', icon: DollarSign },
  { name: 'Payouts', href: '/payouts', icon: CreditCard },
  { name: 'Studio', href: '/studio', icon: Video },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">NEXUS</span>
              <span className="ml-2 text-xs text-gray-500">Creator</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-600">JC</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  John Creator
                </p>
                <p className="text-xs text-gray-500 truncate">
                  john@creator.com
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
