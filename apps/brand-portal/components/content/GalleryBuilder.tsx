'use client'

import { useState } from 'react'
import { Plus, X, Save, ShoppingBag } from 'lucide-react'
import { ProductTagger } from './ProductTagger'
import { toast } from 'sonner'

export function GalleryBuilder({ galleryId }: { galleryId: string }) {
  const [galleryName, setGalleryName] = useState('Summer Collection 2024')
  const [selectedContent, setSelectedContent] = useState<string[]>([])
  const [showProductTagger, setShowProductTagger] = useState<string | null>(null)

  const availableContent = [
    { id: '1', thumbnail: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', tagged: false },
    { id: '2', thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', tagged: true },
    { id: '3', thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400', tagged: false },
    { id: '4', thumbnail: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', tagged: true },
    { id: '5', thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', tagged: false },
    { id: '6', thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400', tagged: true },
  ]

  const handleSave = async () => {
    try {
      // TODO: API call to save gallery
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Gallery saved successfully!')
    } catch (error) {
      toast.error('Failed to save gallery')
    }
  }

  return (
    <div className="space-y-6">
      {/* Gallery Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gallery Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gallery Name
            </label>
            <input
              type="text"
              value={galleryName}
              onChange={(e) => setGalleryName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gallery URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value="yoursite.com/galleries/summer-2024"
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Content</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableContent.map((content) => (
            <div key={content.id} className="relative group">
              <img
                src={content.thumbnail}
                alt="Content"
                className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                onClick={() => {
                  if (selectedContent.includes(content.id)) {
                    setSelectedContent(selectedContent.filter((id) => id !== content.id))
                  } else {
                    setSelectedContent([...selectedContent, content.id])
                  }
                }}
              />
              {selectedContent.includes(content.id) && (
                <div className="absolute inset-0 bg-primary-600/20 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {selectedContent.indexOf(content.id) + 1}
                    </span>
                  </div>
                </div>
              )}
              {content.tagged && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-600 text-white p-1.5 rounded-full">
                    <ShoppingBag className="w-3 h-3" />
                  </div>
                </div>
              )}
              {selectedContent.includes(content.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowProductTagger(content.id)
                  }}
                  className="absolute bottom-2 left-2 right-2 bg-white/90 hover:bg-white text-xs font-medium py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Tag Products
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Content Preview */}
      {selectedContent.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Selected Content ({selectedContent.length})
            </h3>
            <button
              onClick={() => setSelectedContent([])}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedContent.map((id, index) => (
              <div key={id} className="relative">
                <img
                  src={availableContent.find((c) => c.id === id)?.thumbnail}
                  alt="Selected"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  onClick={() => setSelectedContent(selectedContent.filter((cid) => cid !== id))}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-primary-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gallery Layout</h3>
        <div className="grid grid-cols-3 gap-4">
          {['Grid', 'Masonry', 'Carousel'].map((layout) => (
            <button
              key={layout}
              className="p-4 border-2 border-gray-300 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{layout}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          Preview
        </button>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Gallery
        </button>
      </div>

      {/* Product Tagger Modal */}
      {showProductTagger && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tag Products</h3>
              <button
                onClick={() => setShowProductTagger(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <ProductTagger
              contentId={showProductTagger}
              onSave={() => {
                setShowProductTagger(null)
                toast.success('Products tagged successfully!')
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
