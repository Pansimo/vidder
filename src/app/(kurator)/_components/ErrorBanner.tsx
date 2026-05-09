'use client'

import { useState } from 'react'

interface Props {
  message: string | null
}

export default function ErrorBanner({ message }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (!message || dismissed) return null

  return (
    <div className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ml-3 text-red-500 hover:text-red-700"
      >
        ✕
      </button>
    </div>
  )
}
