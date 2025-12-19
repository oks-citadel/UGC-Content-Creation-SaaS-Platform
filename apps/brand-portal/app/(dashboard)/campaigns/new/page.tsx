'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CampaignWizard } from '@/components/campaigns/CampaignWizard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCampaignPage() {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/campaigns"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="mt-1 text-sm text-gray-500">
          Launch a new UGC campaign and start collaborating with creators
        </p>
      </div>

      {/* Campaign Wizard */}
      <CampaignWizard />
    </div>
  )
}
