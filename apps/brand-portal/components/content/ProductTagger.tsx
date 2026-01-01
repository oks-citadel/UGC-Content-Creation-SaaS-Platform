'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Search, Plus, X, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'

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
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch products from API
  const fetchProducts = useCallback(async (search?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.products.getAll({
        search: search || undefined,
        limit: 20,
      })
      if (response.data?.data) {
        setProducts(response.data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price || 0,
          image: p.imageUrl || p.images?.[0] || '/placeholder-product.png',
          sku: p.sku || p.id,
        })))
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load products on mount and when search changes
  useEffect(() => {
    fetchProducts(debouncedSearch)
  }, [debouncedSearch, fetchProducts])

  const filteredProducts = products.filter((product) =>
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
                <Image
                  src={product.image}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="rounded object-cover"
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-sm text-gray-500">Loading products...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={() => fetchProducts(searchQuery)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No products found</p>
            {searchQuery && (
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => {
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
                <Image
                  src={product.image}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="rounded object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-product.png'
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">${product.price.toFixed(2)} • SKU: {product.sku}</p>
                </div>
                {isSelected ? (
                  <span className="text-primary-600 text-sm font-medium">Added</span>
                ) : (
                  <Plus className="w-5 h-5 text-gray-400" />
                )}
              </div>
            )
          })
        )}
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
