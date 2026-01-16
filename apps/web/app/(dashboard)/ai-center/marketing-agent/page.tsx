'use client';

import { useState } from 'react';

type TabType = 'chat' | 'campaign' | 'flow' | 'segment';

const tabs: { id: TabType; name: string }[] = [
  { id: 'chat', name: 'Chat' },
  { id: 'campaign', name: 'Campaign Builder' },
  { id: 'flow', name: 'Flow Builder' },
  { id: 'segment', name: 'Segment Builder' },
];

const sampleMessages = [
  { role: 'assistant', content: 'Hello! I\'m your Marketing Agent. I can help you create campaigns, build automation flows, and define audience segments. What would you like to create today?' },
];

export default function MarketingAgentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [messages, setMessages] = useState(sampleMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I understand you want to create something. Let me help you with that. Could you provide more details about your goals and target audience?'
      }]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing Agent</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Build campaigns, flows, and segments with natural language
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe what you want to create..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                Send
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              {['Create a summer sale campaign', 'Build a welcome flow', 'Segment high-value customers'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaign' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Builder</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Describe your campaign goals and let AI generate a complete campaign structure.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campaign Goal
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="e.g., Launch a summer collection promotion targeting fashion enthusiasts aged 18-35..."
              />
            </div>
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
              Generate Campaign
            </button>
          </div>
        </div>
      )}

      {activeTab === 'flow' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Flow Builder</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Describe your automation flow and AI will create it for you.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Flow Description
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="e.g., When a user signs up, wait 1 day, then send a welcome email. If they don't open it, send a reminder..."
              />
            </div>
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
              Generate Flow
            </button>
          </div>
        </div>
      )}

      {activeTab === 'segment' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Segment Builder</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Describe your target audience and AI will create the segment rules.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Audience Description
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="e.g., Customers who purchased more than $500 in the last 30 days and have opened at least 3 emails..."
              />
            </div>
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
              Generate Segment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
