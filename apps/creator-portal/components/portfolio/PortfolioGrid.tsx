'use client';

import Link from 'next/link';
import { Eye, Heart, MessageCircle, MoreVertical, Image as ImageIcon, Video } from 'lucide-react';

interface PortfolioGridProps {
  filter: string;
}

export default function PortfolioGrid({ filter }: PortfolioGridProps) {
  const portfolioItems = [
    {
      id: '1',
      title: 'Summer Fashion Campaign',
      type: 'image',
      views: '12.5K',
      likes: '1.2K',
      comments: 234,
      date: '2024-06-10',
    },
    {
      id: '2',
      title: 'Beach Lifestyle Video',
      type: 'video',
      views: '24.3K',
      likes: '2.1K',
      comments: 456,
      date: '2024-06-08',
    },
    {
      id: '3',
      title: 'Product Photoshoot',
      type: 'image',
      views: '8.7K',
      likes: '890',
      comments: 123,
      date: '2024-06-05',
    },
    {
      id: '4',
      title: 'Instagram Reel',
      type: 'reel',
      views: '45.2K',
      likes: '4.5K',
      comments: 789,
      date: '2024-06-03',
    },
    {
      id: '5',
      title: 'Fitness Tutorial',
      type: 'video',
      views: '18.9K',
      likes: '1.8K',
      comments: 345,
      date: '2024-06-01',
    },
    {
      id: '6',
      title: 'Fashion Flat Lay',
      type: 'image',
      views: '9.4K',
      likes: '1.1K',
      comments: 178,
      date: '2024-05-28',
    },
  ];

  const filteredItems = portfolioItems.filter(
    (item) => filter === 'all' || item.type === filter
  );

  return (
    <>
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="card group hover:shadow-xl transition-shadow p-0 overflow-hidden"
            >
              <div className="relative aspect-square bg-gray-200 flex items-center justify-center">
                {item.type === 'video' || item.type === 'reel' ? (
                  <Video className="h-12 w-12 text-gray-400" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                )}
                <div className="absolute top-2 right-2">
                  <button className="p-2 bg-white/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="badge badge-primary capitalize">{item.type}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 truncate">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {item.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {item.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {item.comments}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.date}</span>
                  <Link
                    href={`/portfolio/${item.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">No portfolio items found</p>
          <p className="text-sm text-gray-400 mt-1">
            Upload your first content to get started
          </p>
        </div>
      )}
    </>
  );
}
