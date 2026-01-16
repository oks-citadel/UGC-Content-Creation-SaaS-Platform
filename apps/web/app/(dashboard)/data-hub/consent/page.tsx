'use client';

import { useState } from 'react';

const consentPurposes = [
  { id: 'marketing', name: 'Marketing Communications', description: 'Email newsletters, promotional offers, and product updates', optIns: 78542, optOuts: 21458, rate: 78.5 },
  { id: 'analytics', name: 'Analytics & Performance', description: 'Usage data to improve our services and user experience', optIns: 92341, optOuts: 7659, rate: 92.3 },
  { id: 'personalization', name: 'Personalization', description: 'Tailored content and recommendations based on your activity', optIns: 65234, optOuts: 34766, rate: 65.2 },
  { id: 'third_party', name: 'Third-Party Sharing', description: 'Sharing data with trusted partners for enhanced services', optIns: 45892, optOuts: 54108, rate: 45.9 },
  { id: 'retargeting', name: 'Retargeting Ads', description: 'Show relevant ads across the web based on your interests', optIns: 52341, optOuts: 47659, rate: 52.3 },
];

const recentConsentChanges = [
  { id: '1', userId: 'user_abc123', email: 'sarah.j@email.com', purpose: 'marketing', action: 'opt_out', timestamp: '2024-01-15T14:32:00Z', source: 'preference_center' },
  { id: '2', userId: 'user_def456', email: 'mike.c@company.com', purpose: 'analytics', action: 'opt_in', timestamp: '2024-01-15T14:28:00Z', source: 'signup' },
  { id: '3', userId: 'user_ghi789', email: 'emma.w@gmail.com', purpose: 'personalization', action: 'opt_in', timestamp: '2024-01-15T14:15:00Z', source: 'preference_center' },
  { id: '4', userId: 'user_jkl012', email: 'alex.r@business.net', purpose: 'third_party', action: 'opt_out', timestamp: '2024-01-15T14:10:00Z', source: 'email_unsubscribe' },
  { id: '5', userId: 'user_mno345', email: 'lisa.p@domain.org', purpose: 'retargeting', action: 'opt_out', timestamp: '2024-01-15T14:05:00Z', source: 'privacy_request' },
];

const complianceSettings = [
  { region: 'GDPR (EU)', enabled: true, features: ['Explicit consent', 'Right to erasure', 'Data portability'] },
  { region: 'CCPA (California)', enabled: true, features: ['Do Not Sell', 'Access rights', 'Deletion requests'] },
  { region: 'LGPD (Brazil)', enabled: true, features: ['Consent management', 'Data correction', 'Anonymization'] },
  { region: 'PIPEDA (Canada)', enabled: false, features: ['Consent requirements', 'Access to information', 'Accountability'] },
];

export default function ConsentPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'purposes' | 'audit' | 'compliance'>('overview');
  const [showPurposeModal, setShowPurposeModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consent Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage user privacy preferences and compliance settings
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
            Export Report
          </button>
          <button
            onClick={() => setShowPurposeModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Purpose
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'purposes', label: 'Consent Purposes' },
            { id: 'audit', label: 'Audit Log' },
            { id: 'compliance', label: 'Compliance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">100,000</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">With consent records</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Opt-In Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">66.8%</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">+2.3% from last month</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Privacy Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">234</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This month</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Requests</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">12</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Requires action</p>
            </div>
          </div>

          {/* Consent Rates Chart Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Consent Rates by Purpose</h3>
            <div className="space-y-4">
              {consentPurposes.map((purpose) => (
                <div key={purpose.id} className="flex items-center gap-4">
                  <div className="w-40 text-sm text-gray-700 dark:text-gray-300 truncate">{purpose.name}</div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          purpose.rate >= 70 ? 'bg-green-500' : purpose.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${purpose.rate}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {purpose.rate}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Changes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Consent Changes</h3>
            <div className="space-y-3">
              {recentConsentChanges.slice(0, 5).map((change) => (
                <div key={change.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${change.action === 'opt_in' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{change.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {change.action === 'opt_in' ? 'Opted in to' : 'Opted out of'} {change.purpose.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(change.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{change.source.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Purposes Tab */}
      {activeTab === 'purposes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consentPurposes.map((purpose) => (
            <div key={purpose.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{purpose.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{purpose.description}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{purpose.optIns.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Opt-ins</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{purpose.optOuts.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Opt-outs</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${purpose.rate >= 70 ? 'text-green-600 dark:text-green-400' : purpose.rate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    {purpose.rate}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  View Users
                </button>
                <button className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-4">
            <input
              type="text"
              placeholder="Search by email or user ID..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
            />
            <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
              <option value="">All Actions</option>
              <option value="opt_in">Opt-in</option>
              <option value="opt_out">Opt-out</option>
            </select>
            <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
              <option value="">All Purposes</option>
              {consentPurposes.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentConsentChanges.map((change) => (
                <tr key={change.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{change.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{change.userId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white capitalize">
                    {change.purpose.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      change.action === 'opt_in'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {change.action === 'opt_in' ? 'Opted In' : 'Opted Out'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {change.source.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(change.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complianceSettings.map((setting) => (
              <div key={setting.region} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{setting.region}</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={setting.enabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
                  </label>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Required features:</p>
                  <div className="flex flex-wrap gap-2">
                    {setting.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          setting.enabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="mt-4 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                  Configure Settings
                </button>
              </div>
            ))}
          </div>

          {/* Data Subject Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Subject Requests</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Access Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">45</p>
                <p className="text-xs text-green-600 dark:text-green-400">All fulfilled</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Deletion Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">128</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">8 pending</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Portability Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">23</p>
                <p className="text-xs text-green-600 dark:text-green-400">All fulfilled</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Do Not Sell</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">38</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">4 pending</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Purpose Modal */}
      {showPurposeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Consent Purpose</h2>
              <button
                onClick={() => setShowPurposeModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purpose Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Product Recommendations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Describe how this data will be used..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Legal Basis
                </label>
                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                  <option value="consent">Consent</option>
                  <option value="legitimate_interest">Legitimate Interest</option>
                  <option value="contract">Contract Performance</option>
                  <option value="legal">Legal Obligation</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Required for service (cannot opt out)</span>
                </label>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowPurposeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPurposeModal(false)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Create Purpose
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
