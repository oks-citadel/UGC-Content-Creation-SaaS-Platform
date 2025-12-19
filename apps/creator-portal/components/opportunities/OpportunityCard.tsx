import Link from 'next/link';
import { DollarSign, Calendar, MapPin, Briefcase } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: {
    id: string;
    title: string;
    brand: string;
    budget: string;
    deadline: string;
    location: string;
    category: string;
    description: string;
  };
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <Link href={`/opportunities/${opportunity.id}`}>
      <div className="card hover:shadow-xl transition-all cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-gray-400">
              {opportunity.brand.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="badge badge-primary">{opportunity.category}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {opportunity.title}
        </h3>
        <p className="text-sm text-gray-600 mb-1">{opportunity.brand}</p>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
          {opportunity.description}
        </p>

        <div className="space-y-2 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold text-gray-900">{opportunity.budget}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{opportunity.deadline}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{opportunity.location}</span>
          </div>
        </div>

        <button className="btn btn-primary w-full mt-4">
          View Details
        </button>
      </div>
    </Link>
  );
}
