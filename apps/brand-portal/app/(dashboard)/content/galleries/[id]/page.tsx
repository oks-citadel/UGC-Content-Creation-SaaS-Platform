'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GalleryBuilder } from '@/components/content/GalleryBuilder'

export default function GalleryEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link
        href="/content/galleries"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Galleries
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Gallery</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customize your shoppable gallery and tag products
        </p>
      </div>

      <GalleryBuilder galleryId={id} />
    </div>
  )
}
