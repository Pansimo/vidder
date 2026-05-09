'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useRef, useEffect } from 'react'

interface Props {
  placeholder?: string
  paramName?: string
}

export default function SearchInput({ placeholder = 'Sök...', paramName = 'q' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentValue = params.get(paramName) ?? ''

  function handleChange(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const next = new URLSearchParams(params)
      if (value.trim()) {
        next.set(paramName, value.trim())
      } else {
        next.delete(paramName)
      }
      // Reset to page 1 on search
      next.delete('page')
      const qs = next.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    }, 300)
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <input
      type="text"
      defaultValue={currentValue}
      onChange={e => handleChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
      style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
    />
  )
}
