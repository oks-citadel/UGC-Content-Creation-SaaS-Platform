'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { AxiosError } from 'axios'

type CampaignFormData = {
  name: string
  description: string
  startDate: string
  endDate: string
  budget: number
  objectives: string[]
  platforms: string[]
  targetAudience: string
  contentType: string[]
  deliverables: number
}

const steps = [
  { id: 1, name: 'Basic Info', description: 'Campaign details' },
  { id: 2, name: 'Objectives', description: 'Goals and platforms' },
  { id: 3, name: 'Requirements', description: 'Content requirements' },
  { id: 4, name: 'Review', description: 'Confirm and launch' },
]

export function CampaignWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CampaignFormData>()

  const onSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true)
    try {
      // Transform form data to match API schema
      const campaignData = {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        budget: Number(data.budget),
        type: 'UGC' as const,
        goals: {
          objectives: data.objectives || [],
          deliverables: Number(data.deliverables) || 1,
        },
        targetAudience: {
          description: data.targetAudience,
          platforms: data.platforms || [],
        },
        tags: data.contentType || [],
      }

      const response = await apiClient.campaigns.create(campaignData)

      if (response.data?.success) {
        toast.success('Campaign created successfully!')
        const campaignId = response.data.data?.id
        if (campaignId) {
          router.push(`/campaigns/${campaignId}`)
        } else {
          router.push('/campaigns')
        }
      } else {
        const errorMessage = response.data?.error?.message || 'Failed to create campaign'
        toast.error(errorMessage)
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>
      const errorMessage = axiosError.response?.data?.error?.message ||
        axiosError.message ||
        'Failed to create campaign. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => setCurrentStep(Math.min(currentStep + 1, steps.length))
  const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 1))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : currentStep === step.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <div className={index < steps.length - 1 ? 'hidden md:block' : ''}>
                  <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                {...register('name', { required: 'Campaign name is required' })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Summer Collection 2024"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe your campaign objectives and what you're looking for..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  {...register('startDate', { required: 'Start date is required' })}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  {...register('endDate', { required: 'End date is required' })}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  {...register('budget', { required: 'Budget is required', min: 1 })}
                  type="number"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="10000"
                />
              </div>
              {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Objectives */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Objectives</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Primary Objectives *
              </label>
              <div className="space-y-2">
                {['Brand Awareness', 'Product Launch', 'Sales Conversion', 'Engagement', 'Reach'].map((objective) => (
                  <label key={objective} className="flex items-center">
                    <input
                      {...register('objectives')}
                      type="checkbox"
                      value={objective}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{objective}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Platforms *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter', 'Pinterest'].map((platform) => (
                  <label key={platform} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      {...register('platforms')}
                      type="checkbox"
                      value={platform}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <textarea
                {...register('targetAudience')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe your target audience demographics and interests..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Requirements */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Content Requirements</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Content Types *
              </label>
              <div className="space-y-2">
                {['Photos', 'Videos', 'Reels/Shorts', 'Stories', 'Blog Posts', 'Reviews'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      {...register('contentType')}
                      type="checkbox"
                      value={type}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Deliverables *
              </label>
              <input
                {...register('deliverables', { required: true, min: 1 })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="10"
              />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Launch</h3>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Campaign Name</p>
                  <p className="font-medium text-gray-900">{watch('name') || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-medium text-gray-900">${watch('budget')?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">{watch('startDate') || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900">{watch('endDate') || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Platforms</p>
                  <p className="font-medium text-gray-900">{watch('platforms')?.join(', ') || 'None selected'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deliverables</p>
                  <p className="font-medium text-gray-900">{watch('deliverables') || '0'}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                By launching this campaign, you agree to our terms and conditions. Your campaign will be visible to creators immediately.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Launch Campaign
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
