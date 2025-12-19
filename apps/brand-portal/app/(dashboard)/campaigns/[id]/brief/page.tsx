'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BriefBuilder } from '@/components/campaigns/BriefBuilder'

export default function CampaignBriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href={`/campaigns/${id}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Campaign
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campaign Brief</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define your campaign requirements and guidelines for creators
        </p>
      </div>

      <BriefBuilder campaignId={id} />
    </div>
  )
}
