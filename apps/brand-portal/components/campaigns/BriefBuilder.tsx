'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { AxiosError } from 'axios'

interface BriefData {
  overview?: string
  brandMessage?: string
  guidelines?: string[]
  doAndDonts?: {
    dos: string[]
    donts: string[]
  }
  hashtags?: string[]
  objectives?: Record<string, unknown>
  targetPlatforms?: string[]
  contentTypes?: string[]
  keyMessages?: string[]
  mentions?: string[]
}

export function BriefBuilder({ campaignId }: { campaignId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [overview, setOverview] = useState('Launch our new summer collection with authentic user-generated content that showcases the versatility and style of our products.')
  const [brandMessage, setBrandMessage] = useState('Celebrate summer style with confidence and authenticity')
  const [guidelines, setGuidelines] = useState<string[]>([
    'Tag our brand handle in all posts',
    'Use hashtag #SummerVibes2024',
    'Include product shots in natural lighting',
  ])
  const [newGuideline, setNewGuideline] = useState('')
  const [dosAndDonts, setDosAndDonts] = useState({
    dos: ['Show product in use', 'Be authentic', 'High-quality images'],
    donts: ['No competitor mentions', 'No offensive language', 'No stock photos'],
  })
  const [hashtags, setHashtags] = useState(['#SummerVibes2024', '#YourBrand', '#UGCCampaign'])
  const initialLoadDone = useRef(false)

  // Load existing brief data
  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    const loadBrief = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.campaigns.getBrief(campaignId)
        if (response.data?.success && response.data?.data) {
          const briefData = response.data.data as BriefData
          if (briefData.overview) setOverview(briefData.overview)
          if (briefData.brandMessage) setBrandMessage(briefData.brandMessage)
          if (briefData.guidelines) setGuidelines(briefData.guidelines)
          if (briefData.doAndDonts) setDosAndDonts(briefData.doAndDonts)
          if (briefData.hashtags) setHashtags(briefData.hashtags)
        }
      } catch (error) {
        // Brief might not exist yet, which is fine
        console.log('No existing brief found, using defaults')
      } finally {
        setIsLoading(false)
      }
    }
    loadBrief()
  }, [campaignId])

  const handleAddGuideline = () => {
    if (newGuideline.trim()) {
      setGuidelines([...guidelines, newGuideline.trim()])
      setNewGuideline('')
    }
  }

  const handleRemoveGuideline = (index: number) => {
    setGuidelines(guidelines.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const briefData = {
        overview,
        objectives: { brandMessage },
        brandGuidelines: {
          guidelines,
          brandMessage,
        },
        doAndDonts: dosAndDonts,
        hashtags,
        keyMessages: [brandMessage],
      }

      const response = await apiClient.campaigns.saveBrief(campaignId, briefData)

      if (response.data?.success) {
        toast.success('Brief saved successfully!')
      } else {
        const errorMessage = response.data?.error?.message || 'Failed to save brief'
        toast.error(errorMessage)
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>
      const errorMessage = axiosError.response?.data?.error?.message ||
        axiosError.message ||
        'Failed to save brief. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-600">Loading brief...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Overview</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Objective
            </label>
            <textarea
              rows={3}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Message
            </label>
            <textarea
              rows={2}
              value={brandMessage}
              onChange={(e) => setBrandMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content Guidelines */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Guidelines</h3>
        <div className="space-y-4">
          {guidelines.map((guideline, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="flex-1 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                {guideline}
              </span>
              <button
                onClick={() => handleRemoveGuideline(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-3">
            <input
              type="text"
              value={newGuideline}
              onChange={(e) => setNewGuideline(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddGuideline()}
              placeholder="Add a new guideline..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={handleAddGuideline}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Do's and Don'ts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Do&apos;s</h3>
          <ul className="space-y-2">
            {dosAndDonts.dos.map((item, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <span className="text-green-500 mr-2 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Don&apos;ts</h3>
          <ul className="space-y-2">
            {dosAndDonts.donts.map((item, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <span className="text-red-500 mr-2 mt-0.5">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Required Hashtags */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Hashtags</h3>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Brand Assets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Assets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">Asset {i}</span>
            </div>
          ))}
        </div>
        <button className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Plus className="w-4 h-4 mr-2" />
          Upload Assets
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Brief
            </>
          )}
        </button>
      </div>
    </div>
  )
}
