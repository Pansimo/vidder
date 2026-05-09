'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import SearchInput from '../../_components/SearchInput'

export default function OmradenFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    next.delete('page')
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="mb-4 flex gap-2">
      <SearchInput placeholder="Sök namn..." />
      <select
        defaultValue={params.get('level') ?? 'all'}
        onChange={e => setParam('level', e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="all">Alla nivåer</option>
        <option value="1">Makroområden</option>
        <option value="2">Subområden</option>
      </select>
      <select
        defaultValue={params.get('status') ?? 'all'}
        onChange={e => setParam('status', e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="all">Alla statusar</option>
        <option value="draft">Utkast</option>
        <option value="review">Granskning</option>
        <option value="published">Publicerat</option>
      </select>
    </div>
  )
}
