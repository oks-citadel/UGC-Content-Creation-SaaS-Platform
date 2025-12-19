import Link from 'next/link';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface CampaignCardProps {
  campaign: {
    id: string;
    title: string;
    brand: string;
    status: string;
    deadline: string;
    progress: number;
    payment: string;
  };
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'badge-primary';
      case 'pending':
        return 'badge-warning';
      case 'completed':
        return 'badge-success';
      default:
        return 'badge-info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="card hover:shadow-xl transition-all cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-gray-400">
              {campaign.brand.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <span className={`badge ${getStatusColor(campaign.status)}`}>
            {getStatusText(campaign.status)}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {campaign.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{campaign.brand}</p>

        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">{campaign.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${campaign.progress}%` }}
            ></div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Due: {campaign.deadline}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-600">{campaign.payment}</span>
          </div>
        </div>

        <button className="btn btn-outline w-full mt-4">
          View Campaign
        </button>
      </div>
    </Link>
  );
}
