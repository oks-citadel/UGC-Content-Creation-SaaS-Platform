'use client';

import { useState } from 'react';
import { X, Upload, Image, Video } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'image',
    tags: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Upload logic here
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload to Portfolio
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, MP4, MOV up to 100MB
            </p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              className="input"
              placeholder="Give your content a title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="input"
              placeholder="Describe your content..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              className="input"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="reel">Reel</option>
              <option value="story">Story</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              className="input"
              placeholder="fashion, lifestyle, summer (comma-separated)"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              Upload Content
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
