import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | NEXUS',
  description: 'Your marketing command center',
};

const stats = [
  { name: 'Active Campaigns', value: '12', change: '+2.5%', changeType: 'positive' },
  { name: 'Total Content', value: '248', change: '+18.2%', changeType: 'positive' },
  { name: 'Active Creators', value: '34', change: '+4.1%', changeType: 'positive' },
  { name: 'Engagement Rate', value: '5.8%', change: '-0.3%', changeType: 'negative' },
];

const recentCampaigns = [
  {
    id: '1',
    name: 'Summer Collection Launch',
    status: 'active',
    creators: 8,
    content: 24,
    progress: 67,
  },
  {
    id: '2',
    name: 'Product Review Series',
    status: 'active',
    creators: 5,
    content: 15,
    progress: 45,
  },
  {
    id: '3',
    name: 'Brand Awareness Q4',
    status: 'draft',
    creators: 0,
    content: 0,
    progress: 0,
  },
];

const recentContent = [
  {
    id: '1',
    title: 'Unboxing Experience',
    creator: 'Sarah Johnson',
    platform: 'Instagram',
    status: 'published',
    engagement: '12.5K',
  },
  {
    id: '2',
    title: 'Product Tutorial',
    creator: 'Mike Chen',
    platform: 'TikTok',
    status: 'pending_review',
    engagement: '-',
  },
  {
    id: '3',
    title: 'Brand Story',
    creator: 'Emma Wilson',
    platform: 'YouTube',
    status: 'approved',
    engagement: '-',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your campaigns.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent campaigns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Campaigns</h2>
            <a
              href="/dashboard/campaigns"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
              View all
            </a>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {campaign.creators} creators · {campaign.content} content pieces
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campaign.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                {campaign.progress > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Progress</span>
                      <span className="font-medium text-gray-900 dark:text-white">{campaign.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Content</h2>
            <a
              href="/dashboard/content"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
              View all
            </a>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentContent.map((content) => (
              <div key={content.id} className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {content.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {content.creator} · {content.platform}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      content.status === 'published'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : content.status === 'approved'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {content.status.replace('_', ' ')}
                  </span>
                  {content.engagement !== '-' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{content.engagement}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Create Campaign', icon: 'MegaphoneIcon', href: '/dashboard/campaigns/new' },
            { name: 'Upload Content', icon: 'CloudArrowUpIcon', href: '/dashboard/content/upload' },
            { name: 'Find Creators', icon: 'UserPlusIcon', href: '/dashboard/creators/discover' },
            { name: 'View Reports', icon: 'ChartBarIcon', href: '/dashboard/analytics' },
          ].map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{action.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
