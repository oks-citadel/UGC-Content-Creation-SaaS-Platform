'use client';

import { useState } from 'react';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import { useOpportunities } from '@/hooks/useOpportunities';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export default function OpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const { data: opportunities, isLoading } = useOpportunities();

  const niches = ['all', 'fashion', 'fitness', 'food', 'tech', 'travel', 'lifestyle'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Opportunities
        </h1>
        <p className="text-gray-600 mt-1">
          Discover brand collaborations that match your style
        </p>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="input min-w-[150px]"
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
            >
              {niches.map((niche) => (
                <option key={niche} value={niche}>
                  {niche.charAt(0).toUpperCase() + niche.slice(1)}
                </option>
              ))}
            </select>
            <button className="btn btn-outline flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(opportunities as any[])?.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}

      {!isLoading && (opportunities as any[])?.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No opportunities found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your filters or check back later
          </p>
        </div>
      )}
    </div>
  );
}
