'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import SearchInput from '../../_components/SearchInput'

interface Curator {
  id: string
  display_name: string | null
}

interface Props {
  curators: Curator[]
}

export default function AuditFilters({ curators }: Props) {
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
    <div className="mb-4 flex flex-wrap gap-2">
      <SearchInput placeholder="Sök post-ID..." paramName="q" />
      <select
        defaultValue={params.get('table') ?? 'all'}
        onChange={e => setParam('table', e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="all">Alla tabeller</option>
        <option value="curated_areas">areas</option>
        <option value="curated_pois">pois</option>
        <option value="curated_collections">collections</option>
        <option value="curated_poi_collections">poi_collections</option>
      </select>
      <select
        defaultValue={params.get('op') ?? 'all'}
        onChange={e => setParam('op', e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="all">Alla operationer</option>
        <option value="insert">Skapad</option>
        <option value="update">Uppdaterad</option>
        <option value="delete">Raderad</option>
      </select>
      <select
        defaultValue={params.get('user') ?? 'all'}
        onChange={e => setParam('user', e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="all">Alla användare</option>
        {curators.map(c => (
          <option key={c.id} value={c.id}>{c.display_name ?? c.id.slice(0, 8)}</option>
        ))}
      </select>
      <select
        defaultValue={params.get('period') ?? 'all'}
        onChange={e => setParam('period', e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="all">Alla tider</option>
        <option value="24h">Senaste 24h</option>
        <option value="7d">Senaste 7 dagar</option>
        <option value="30d">Senaste 30 dagar</option>
      </select>
    </div>
  )
}
