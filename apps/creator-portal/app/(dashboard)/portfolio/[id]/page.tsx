'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function EditPortfolioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: 'Summer Fashion Campaign',
    description: 'Beach-themed fashion shoot for summer collection',
    tags: 'fashion, summer, lifestyle',
    category: 'image',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic here
    router.push('/portfolio');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this portfolio item?')) {
      // Delete logic here
      router.push('/portfolio');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/portfolio"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolio
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Edit Portfolio Item
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="font-semibold mb-4">Preview</h3>
            <div className="aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <p className="text-gray-500">Image Preview</p>
            </div>
            <button className="btn btn-outline w-full">
              Change Image
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                required
                className="input"
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
                rows={4}
                className="input"
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
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                className="input"
                placeholder="fashion, lifestyle, summer"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex items-center justify-center gap-2 flex-1">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
