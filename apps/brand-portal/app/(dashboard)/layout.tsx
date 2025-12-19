'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Image,
  BarChart3,
  Settings,
  CreditCard,
  Layers,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Building2,
  UserCircle
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Creator Marketplace', href: '/marketplace', icon: Users },
  { name: 'Content Library', href: '/content', icon: Image },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Integrations', href: '/integrations', icon: Layers },
  { name: 'Team', href: '/team', icon: UserCircle },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white">
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <span className="text-2xl font-bold text-primary-600">NEXUS</span>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={clsx('w-5 h-5 mr-3', isActive ? 'text-primary-600' : 'text-gray-400')} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-6 border-b">
            <span className="text-2xl font-bold text-primary-600">NEXUS</span>
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded">
              Brand
            </span>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className={clsx('w-5 h-5 mr-3', isActive ? 'text-primary-600' : 'text-gray-400')} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form className="relative flex flex-1 items-center" action="#" method="GET">
              <Search className="pointer-events-none absolute left-3 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search campaigns, creators, content..."
                className="w-full border-0 py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
              />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button type="button" className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-gray-900"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-2 text-sm font-semibold leading-6 text-gray-900">
                      Acme Inc.
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2.5 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-gray-900/5">
                      <div className="p-3 border-b">
                        <p className="text-sm font-medium text-gray-900">Acme Inc.</p>
                        <p className="text-xs text-gray-500">admin@acme.com</p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/settings"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                        >
                          <Settings className="w-4 h-4 mr-3 text-gray-400" />
                          Settings
                        </Link>
                        <button
                          className="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <LogOut className="w-4 h-4 mr-3 text-red-400" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
