'use client'

import { useState } from 'react'
import { Search, Plus, X } from 'lucide-react'

type Product = {
  id: string
  name: string
  price: number
  image: string
  sku: string
}

export function ProductTagger({ contentId, onSave }: { contentId: string; onSave: () => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Summer Dress - Blue',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=100',
      sku: 'SD-BLU-001',
    },
    {
      id: '2',
      name: 'Beach Sandals',
      price: 39.99,
      image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=100',
      sku: 'BS-001',
    },
    {
      id: '3',
      name: 'Sunglasses - Aviator',
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100',
      sku: 'SG-AVI-001',
    },
    {
      id: '4',
      name: 'Straw Hat',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=100',
      sku: 'SH-001',
    },
  ]

  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddProduct = (product: Product) => {
    if (!selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product])
    }
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId))
  }

  return (
    <div className="p-6">
      {/* Content Preview */}
      <div className="mb-6">
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-gray-400">Content Preview</span>
        </div>
      </div>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Tagged Products ({selectedProducts.length})
          </h4>
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">${product.price} • SKU: {product.sku}</p>
                </div>
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Products
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
        {filteredProducts.map((product) => {
          const isSelected = selectedProducts.find((p) => p.id === product.id)
          return (
            <div
              key={product.id}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleAddProduct(product)}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">${product.price} • SKU: {product.sku}</p>
              </div>
              {isSelected ? (
                <span className="text-primary-600 text-sm font-medium">Added</span>
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onSave}
          className="px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Save Tags
        </button>
      </div>
    </div>
  )
}
