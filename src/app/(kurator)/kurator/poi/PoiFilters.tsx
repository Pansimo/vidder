'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface AreaOption {
  id: string
  name: string
}

interface Props {
  subAreas: AreaOption[]
}

const CATEGORIES = [
  'natur', 'nationalpark', 'utsikt', 'kust',
  'kultur', 'historia', 'arkitektur', 'urban_overlay',
]

export default function PoiFilters({ subAreas }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <select
        defaultValue={params.get('area') ?? 'all'}
        onChange={e => setParam('area', e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="all">Alla områden</option>
        {subAreas.map(a => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <select
        defaultValue={params.get('category') ?? 'all'}
        onChange={e => setParam('category', e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="all">Alla kategorier</option>
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
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
