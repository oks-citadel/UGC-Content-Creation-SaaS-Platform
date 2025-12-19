import { Clock, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';

export default function RecentActivity() {
  const activities = [
    {
      id: '1',
      type: 'success',
      title: 'Campaign Completed',
      description: 'Summer Fashion Campaign',
      time: '2 hours ago',
      icon: CheckCircle,
    },
    {
      id: '2',
      type: 'info',
      title: 'New Opportunity',
      description: 'Tech Product Review',
      time: '4 hours ago',
      icon: AlertCircle,
    },
    {
      id: '3',
      type: 'message',
      title: 'New Message',
      description: 'StyleCo replied to your application',
      time: '6 hours ago',
      icon: MessageCircle,
    },
    {
      id: '4',
      type: 'pending',
      title: 'Payment Pending',
      description: 'Fitness Equipment Showcase',
      time: '1 day ago',
      icon: Clock,
    },
  ];

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      case 'message':
        return 'text-purple-600 bg-purple-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="card h-full">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className={`p-2 rounded-lg h-fit ${getIconColor(activity.type)}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              <p className="text-xs text-gray-600 truncate">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
