'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function SavedToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const show = searchParams.get('saved') === '1'

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => router.replace(pathname), 3000)
    return () => clearTimeout(timer)
  }, [show, router, pathname])

  if (!show) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Sparat!
    </div>
  )
}
