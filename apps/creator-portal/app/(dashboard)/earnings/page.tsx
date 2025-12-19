'use client';

import EarningsChart from '@/components/earnings/EarningsChart';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function EarningsPage() {
  const stats = [
    {
      label: 'Total Earnings',
      value: '$24,580',
      change: '+12.5%',
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'This Month',
      value: '$3,450',
      change: '+8.2%',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      label: 'Pending',
      value: '$1,200',
      change: '2 campaigns',
      icon: Clock,
      color: 'yellow',
    },
    {
      label: 'Available',
      value: '$2,890',
      change: 'Ready to withdraw',
      icon: CheckCircle,
      color: 'purple',
    },
  ];

  const recentEarnings = [
    {
      campaign: 'Summer Fashion Campaign',
      brand: 'StyleCo',
      amount: '$2,000',
      date: '2024-06-15',
      status: 'paid',
    },
    {
      campaign: 'Tech Product Review',
      brand: 'TechGadgets Inc',
      amount: '$1,500',
      date: '2024-06-10',
      status: 'paid',
    },
    {
      campaign: 'Fitness Equipment Showcase',
      brand: 'FitPro',
      amount: '$1,800',
      date: '2024-06-05',
      status: 'pending',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Earnings
          </h1>
          <p className="text-gray-600 mt-1">
            Track your income and payment history
          </p>
        </div>
        <button className="btn btn-primary self-start md:self-auto">
          Request Payout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <stat.icon
                className={`h-5 w-5 text-${stat.color}-600`}
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {stat.value}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Earnings Overview</h2>
        <EarningsChart />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Campaign
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Brand
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentEarnings.map((earning, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {earning.campaign}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {earning.brand}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                    {earning.amount}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {earning.date}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge ${
                        earning.status === 'paid'
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {earning.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
