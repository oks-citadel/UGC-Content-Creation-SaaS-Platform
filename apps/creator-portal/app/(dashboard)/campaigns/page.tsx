'use client';

import CampaignCard from '@/components/campaigns/CampaignCard';
import { Tabs } from '@/components/ui/Tabs';
import { useState } from 'react';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('active');

  const campaigns = {
    active: [
      {
        id: '1',
        title: 'Summer Fashion Campaign',
        brand: 'StyleCo',
        status: 'in-progress',
        deadline: '2024-06-30',
        progress: 65,
        payment: '$2,000',
      },
      {
        id: '2',
        title: 'Tech Product Review',
        brand: 'TechGadgets Inc',
        status: 'in-progress',
        deadline: '2024-07-15',
        progress: 30,
        payment: '$1,500',
      },
    ],
    pending: [
      {
        id: '3',
        title: 'Fitness Equipment Showcase',
        brand: 'FitPro',
        status: 'pending',
        deadline: '2024-08-01',
        progress: 0,
        payment: '$1,800',
      },
    ],
    completed: [
      {
        id: '4',
        title: 'Spring Collection Launch',
        brand: 'FashionHub',
        status: 'completed',
        deadline: '2024-05-15',
        progress: 100,
        payment: '$2,500',
      },
    ],
  };

  const tabs = [
    { id: 'active', label: 'Active', count: campaigns.active.length },
    { id: 'pending', label: 'Pending', count: campaigns.pending.length },
    { id: 'completed', label: 'Completed', count: campaigns.completed.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          My Campaigns
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your active and upcoming brand collaborations
        </p>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns[activeTab as keyof typeof campaigns].map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {campaigns[activeTab as keyof typeof campaigns].length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No {activeTab} campaigns</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === 'active' && 'Start by applying to opportunities'}
            {activeTab === 'pending' && 'Your applications will appear here'}
            {activeTab === 'completed' && 'Completed campaigns will show up here'}
          </p>
        </div>
      )}
    </div>
  );
}
