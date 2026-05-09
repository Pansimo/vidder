'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Props {
  column: string
  label: string
  className?: string
}

export default function SortableHeader({ column, label, className = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const currentSort = params.get('sort')
  const currentDir = params.get('dir')
  const isActive = currentSort === column

  function handleClick() {
    const next = new URLSearchParams(params)

    if (!isActive) {
      next.set('sort', column)
      next.set('dir', 'asc')
    } else if (currentDir === 'asc') {
      next.set('sort', column)
      next.set('dir', 'desc')
    } else {
      next.delete('sort')
      next.delete('dir')
    }

    next.delete('page')
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const arrow = isActive ? (currentDir === 'asc' ? ' \u2191' : ' \u2193') : ''

  return (
    <th
      className={`px-4 py-3 cursor-pointer select-none hover:text-gray-700 ${className}`}
      onClick={handleClick}
    >
      {label}{arrow}
    </th>
  )
}
