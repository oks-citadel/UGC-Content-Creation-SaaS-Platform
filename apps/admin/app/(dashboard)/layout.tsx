'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  FileVideo,
  Megaphone,
  CreditCard,
  DollarSign,
  FileText,
  Scale,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { name: 'Creators', href: '/creators', icon: UserCheck },
  { name: 'Content', href: '/content', icon: FileVideo },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
    children: [
      { name: 'Overview', href: '/billing', icon: CreditCard },
      { name: 'Invoices', href: '/billing/invoices', icon: FileText },
    ],
  },
  { name: 'Payouts', href: '/payouts', icon: DollarSign },
  { name: 'Reports', href: '/reports', icon: FileText },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: Scale,
    children: [
      { name: 'Overview', href: '/compliance', icon: Scale },
      { name: 'Disputes', href: '/compliance/disputes', icon: FileText },
      { name: 'Rights', href: '/compliance/rights', icon: FileText },
    ],
  },
  {
    name: 'System',
    href: '/system',
    icon: Settings,
    children: [
      { name: 'Health', href: '/system', icon: Settings },
      { name: 'Logs', href: '/system/logs', icon: FileText },
      { name: 'Jobs', href: '/system/jobs', icon: Settings },
    ],
  },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  const Icon = item.icon;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.name}</span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  expanded && 'rotate-180'
                )}
              />
            </>
          )}
        </button>
        {!collapsed && expanded && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children.map((child) => (
              <NavLink key={child.href} item={child} collapsed={false} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>{item.name}</span>}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300',
          sidebarCollapsed ? 'w-20' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">NEXUS Admin</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:block hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.href} item={item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              // Handle logout
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-600">Super Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              AU
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
