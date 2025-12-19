'use client';

import { useState } from 'react';
import { Upload, Image, Video, FileText, Download, Share2, Edit } from 'lucide-react';

export default function StudioPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const recentProjects = [
    {
      id: '1',
      name: 'Summer Campaign Video',
      type: 'video',
      date: '2024-06-15',
      thumbnail: '/placeholder.jpg',
    },
    {
      id: '2',
      name: 'Product Photoshoot',
      type: 'image',
      date: '2024-06-14',
      thumbnail: '/placeholder.jpg',
    },
    {
      id: '3',
      name: 'Instagram Reel Draft',
      type: 'video',
      date: '2024-06-13',
      thumbnail: '/placeholder.jpg',
    },
  ];

  const tools = [
    {
      name: 'Image Editor',
      description: 'Edit and enhance your photos',
      icon: Image,
      color: 'blue',
    },
    {
      name: 'Video Editor',
      description: 'Create and edit video content',
      icon: Video,
      color: 'purple',
    },
    {
      name: 'Caption Generator',
      description: 'AI-powered captions for your posts',
      icon: FileText,
      color: 'green',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Content Studio
        </h1>
        <p className="text-gray-600 mt-1">
          Create and edit your content in one place
        </p>
      </div>

      <div className="card">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Content
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your files here, or click to browse
          </p>
          <button className="btn btn-primary">
            Choose Files
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Supported formats: JPG, PNG, MP4, MOV (Max 100MB)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <div
            key={index}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className={`p-3 bg-${tool.color}-100 rounded-lg w-fit mb-4`}>
              <tool.icon className={`h-6 w-6 text-${tool.color}-600`} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{tool.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{tool.description}</p>
            <button className="btn btn-outline w-full">
              Open Tool
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                {project.type === 'video' ? (
                  <Video className="h-12 w-12 text-gray-400" />
                ) : (
                  <Image className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{project.date}</p>
                <div className="flex gap-2">
                  <button className="btn btn-outline text-sm flex-1 flex items-center justify-center gap-1">
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Share2 className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Quick Tips</h2>
        <div className="space-y-3">
          {[
            'Use natural lighting for better product shots',
            'Keep videos under 60 seconds for better engagement',
            'Add captions to make content accessible',
            'Maintain consistent branding across all content',
          ].map((tip, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
            >
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-sm text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
