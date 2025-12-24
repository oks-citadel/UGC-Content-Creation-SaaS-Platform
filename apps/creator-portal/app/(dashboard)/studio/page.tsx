'use client';

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Video, FileText, Download, Share2, Edit, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  type: 'video' | 'image';
  date: string;
  thumbnail: string | null;
  thumbnailUrl?: string;
}

export default function StudioPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's recent content from content service
        const response = await fetch('/api/content/projects?limit=6&sortBy=updatedAt&sortOrder=desc');

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        const projects = data.data || data.projects || [];

        // Transform and enrich with thumbnail URLs
        const enrichedProjects: Project[] = await Promise.all(
          projects.map(async (project: any) => {
            let thumbnailUrl = project.thumbnail || project.thumbnailUrl || null;

            // If we have a media ID but no URL, fetch the signed URL
            if (!thumbnailUrl && project.thumbnailId) {
              try {
                const mediaResponse = await fetch(`/api/media/${project.thumbnailId}/url`);
                if (mediaResponse.ok) {
                  const mediaData = await mediaResponse.json();
                  thumbnailUrl = mediaData.url || mediaData.signedUrl;
                }
              } catch (e) {
                console.warn(`Failed to fetch thumbnail for project ${project.id}`);
              }
            }

            return {
              id: project.id || project._id,
              name: project.name || project.title || 'Untitled Project',
              type: project.type || project.contentType || (project.mimeType?.startsWith('video') ? 'video' : 'image'),
              date: formatDate(project.updatedAt || project.createdAt || new Date().toISOString()),
              thumbnail: thumbnailUrl,
              thumbnailUrl: thumbnailUrl,
            };
          })
        );

        setRecentProjects(enrichedProjects);
      } catch (err) {
        console.error('Failed to fetch recent projects:', err);
        setError('Failed to load recent projects');
        setRecentProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProjects();
  }, []);

  // Helper to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const tools = [
    {
      name: 'Image Editor',
      description: 'Edit and enhance your photos',
      icon: ImageIcon,
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              Try again
            </button>
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No projects yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload content to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = project.type === 'video'
                          ? '<svg class="h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>'
                          : '<svg class="h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                      }}
                    />
                  ) : project.type === 'video' ? (
                    <Video className="h-12 w-12 text-gray-400" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1 truncate">
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
        )}
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
