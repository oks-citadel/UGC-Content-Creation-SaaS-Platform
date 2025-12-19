'use client'

import { useState } from 'react'
import { CreditCard, Download, Check, Zap, Building2, Crown } from 'lucide-react'

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const currentPlan = {
    name: 'Professional',
    price: 299,
    billingCycle: 'monthly',
    features: [
      'Up to 50 active campaigns',
      '100 creator connections',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
    ],
  }

  const plans = [
    {
      name: 'Starter',
      icon: Zap,
      monthlyPrice: 99,
      annualPrice: 950,
      features: [
        'Up to 10 active campaigns',
        '25 creator connections',
        'Basic analytics',
        'Email support',
        'Standard features',
      ],
      recommended: false,
    },
    {
      name: 'Professional',
      icon: Building2,
      monthlyPrice: 299,
      annualPrice: 2870,
      features: [
        'Up to 50 active campaigns',
        '100 creator connections',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access',
      ],
      recommended: true,
    },
    {
      name: 'Enterprise',
      icon: Crown,
      monthlyPrice: 999,
      annualPrice: 9590,
      features: [
        'Unlimited campaigns',
        'Unlimited creators',
        'Enterprise analytics',
        'Dedicated support',
        'White-label solution',
        'Custom integrations',
        'SLA guarantee',
      ],
      recommended: false,
    },
  ]

  const invoices = [
    { id: 'INV-001', date: '2024-06-01', amount: 299, status: 'paid', description: 'Professional Plan - June 2024' },
    { id: 'INV-002', date: '2024-05-01', amount: 299, status: 'paid', description: 'Professional Plan - May 2024' },
    { id: 'INV-003', date: '2024-04-01', amount: 299, status: 'paid', description: 'Professional Plan - April 2024' },
    { id: 'INV-004', date: '2024-03-01', amount: 299, status: 'paid', description: 'Professional Plan - March 2024' },
  ]

  const usageStats = [
    { label: 'Active Campaigns', current: 32, limit: 50, percentage: 64 },
    { label: 'Creator Connections', current: 78, limit: 100, percentage: 78 },
    { label: 'Team Members', current: 4, limit: 10, percentage: 40 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">{currentPlan.name} Plan</h3>
            <p className="text-primary-100">Your current subscription</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">${currentPlan.price}</div>
            <div className="text-primary-100">per month</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {currentPlan.features.map((feature) => (
            <div key={feature} className="flex items-center text-sm">
              <Check className="w-4 h-4 mr-2 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors">
            Change Plan
          </button>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-400 transition-colors">
            Update Payment Method
          </button>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Overview</h3>
        <div className="space-y-4">
          {usageStats.map((stat) => (
            <div key={stat.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                <span className="text-sm text-gray-500">
                  {stat.current} / {stat.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    stat.percentage > 80 ? 'bg-red-600' : 'bg-primary-600'
                  }`}
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Available Plans</h3>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-green-600 font-semibold">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
            const isCurrentPlan = plan.name === currentPlan.name

            return (
              <div
                key={plan.name}
                className={`border-2 rounded-lg p-6 ${
                  plan.recommended
                    ? 'border-primary-600 shadow-lg'
                    : 'border-gray-200'
                } ${isCurrentPlan ? 'ring-2 ring-primary-600' : ''}`}
              >
                {plan.recommended && (
                  <span className="inline-block px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full mb-4">
                    Recommended
                  </span>
                )}
                {isCurrentPlan && (
                  <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full mb-4">
                    Current Plan
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-500">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-gray-700">
                      <Check className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrentPlan}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.recommended
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Visa ending in 4242</p>
              <p className="text-sm text-gray-500">Expires 12/2025</p>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Update
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{invoice.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${invoice.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-end w-full">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
