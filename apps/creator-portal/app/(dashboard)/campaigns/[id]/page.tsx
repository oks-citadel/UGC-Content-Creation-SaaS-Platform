'use client';

import { useState } from 'react';
import Link from 'next/link';
import DeliverableList from '@/components/campaigns/DeliverableList';
import { ArrowLeft, Calendar, DollarSign, AlertCircle, MessageSquare, Upload } from 'lucide-react';

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with API call
  const campaign = {
    id: params.id,
    title: 'Summer Fashion Campaign',
    brand: 'StyleCo',
    status: 'in-progress',
    startDate: '2024-06-01',
    deadline: '2024-06-30',
    payment: '$2,000',
    progress: 65,
    description: 'Create engaging content showcasing our summer collection with a focus on beach and casual wear.',
    brief: {
      objectives: 'Increase brand awareness and drive sales for summer collection',
      targetAudience: 'Women 18-35, fashion-conscious, active on social media',
      brandGuidelines: 'Use bright, vibrant colors. Include brand hashtag #StyleCoSummer',
      dos: [
        'Showcase products in natural lighting',
        'Include lifestyle shots',
        'Use our brand hashtags',
        'Tag our official account',
      ],
      donts: [
        'Don\'t use competitor products in same shot',
        'Avoid dark or gloomy settings',
        'Don\'t over-edit colors',
      ],
    },
  };

  const deliverables = [
    {
      id: '1',
      type: 'Instagram Post',
      description: 'Feed post featuring summer dress collection',
      dueDate: '2024-06-10',
      status: 'completed',
      submittedDate: '2024-06-09',
    },
    {
      id: '2',
      type: 'Instagram Reel',
      description: '15-30 second reel showcasing beach wear',
      dueDate: '2024-06-15',
      status: 'in-review',
      submittedDate: '2024-06-14',
    },
    {
      id: '3',
      type: 'Instagram Stories',
      description: '5 stories featuring different products',
      dueDate: '2024-06-20',
      status: 'pending',
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'deliverables', label: 'Deliverables' },
    { id: 'brief', label: 'Campaign Brief' },
    { id: 'messages', label: 'Messages' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link
          href="/campaigns"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {campaign.title}
            </h1>
            <p className="text-gray-600 mt-1">{campaign.brand}</p>
          </div>
          <span className="badge badge-primary self-start md:self-auto">
            {campaign.status === 'in-progress' ? 'In Progress' : campaign.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-sm text-gray-600">Deadline</p>
              <p className="font-semibold text-gray-900">{campaign.deadline}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Payment</p>
              <p className="font-semibold text-gray-900">{campaign.payment}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="font-semibold text-gray-900">{campaign.progress}%</p>
            </div>
          </div>
        </div>
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
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Campaign Description</h3>
                <p className="text-gray-700">{campaign.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Progress Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Overall Progress</span>
                    <span>{campaign.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${campaign.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">1</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">1</p>
                  <p className="text-sm text-gray-600">In Review</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">1</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deliverables' && (
            <DeliverableList deliverables={deliverables} campaignId={campaign.id} />
          )}

          {activeTab === 'brief' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Campaign Objectives</h3>
                <p className="text-gray-700">{campaign.brief.objectives}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Target Audience</h3>
                <p className="text-gray-700">{campaign.brief.targetAudience}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Brand Guidelines</h3>
                <p className="text-gray-700">{campaign.brief.brandGuidelines}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">Do&apos;s</h4>
                  <ul className="space-y-2">
                    {campaign.brief.dos.map((item, index) => (
                      <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-3">Don&apos;ts</h4>
                  <ul className="space-y-2">
                    {campaign.brief.donts.map((item, index) => (
                      <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="text-red-600">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No messages yet</p>
                <button className="btn btn-primary mt-4">
                  Send Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
