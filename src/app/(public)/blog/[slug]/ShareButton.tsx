'use client'

import { Share2 } from 'lucide-react'

export default function ShareButton({ title }: { title: string }) {
  return (
    <button
      onClick={() => {
        if (typeof navigator !== 'undefined') {
          navigator.share?.({ title, url: window.location.href })
        }
      }}
      className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1E4ED8] text-sm transition-colors"
    >
      <Share2 className="h-4 w-4" /> Compartilhar
    </button>
  )
}
