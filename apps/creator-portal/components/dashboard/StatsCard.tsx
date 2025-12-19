import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  color: string;
}

export default function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: StatsCardProps) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span
          className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}
