'use client';

import { useState } from 'react';
import PortfolioGrid from '@/components/portfolio/PortfolioGrid';
import UploadModal from '@/components/portfolio/UploadModal';
import { Plus, Filter } from 'lucide-react';

export default function PortfolioPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Portfolio
          </h1>
          <p className="text-gray-600 mt-1">
            Showcase your best work to attract brands
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Upload Content
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {['all', 'images', 'videos', 'reels'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <PortfolioGrid filter={filter} />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
