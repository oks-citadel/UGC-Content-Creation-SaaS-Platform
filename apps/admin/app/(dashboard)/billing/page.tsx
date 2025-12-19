'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { RevenueChart } from '@/components/billing/RevenueChart';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Revenue</h1>
        <p className="text-gray-600 mt-2">Monitor revenue and subscription metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'MRR', value: formatCurrency(284000), icon: DollarSign, change: '+12.5%' },
          { label: 'ARR', value: formatCurrency(3408000), icon: TrendingUp, change: '+12.5%' },
          { label: 'Active Subscriptions', value: '1,240', icon: CreditCard, change: '+8.3%' },
          { label: 'Paying Customers', value: '980', icon: Users, change: '+15.7%' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <stat.icon className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-green-600 mt-2">{stat.change} vs last month</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-6">Revenue Overview</h2>
        <RevenueChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue by Plan</h2>
          <div className="space-y-3">
            {[
              { plan: 'Enterprise', revenue: 124800, customers: 42 },
              { plan: 'Professional', revenue: 89400, customers: 179 },
              { plan: 'Starter', revenue: 69800, customers: 759 },
            ].map((item) => (
              <div key={item.plan} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{item.plan}</p>
                  <p className="text-sm text-gray-600">{item.customers} customers</p>
                </div>
                <p className="font-bold">{formatCurrency(item.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {[
              { org: 'Acme Corp', amount: 2999, date: '2 hours ago' },
              { org: 'Fashion Co', amount: 999, date: '5 hours ago' },
              { org: 'Tech Brand', amount: 499, date: '1 day ago' },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{tx.org}</p>
                  <p className="text-sm text-gray-600">{tx.date}</p>
                </div>
                <p className="font-medium text-green-600">+{formatCurrency(tx.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
