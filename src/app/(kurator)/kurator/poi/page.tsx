import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '../../_components/StatusBadge'
import PoiFilters from './PoiFilters'

interface Props {
  searchParams: Promise<{ area?: string; category?: string; status?: string }>
}

export default async function AllaPoisPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('curated_pois')
    .select('id, name, category, status, is_featured, display_priority, short_description, area_id')
    .order('display_priority', { ascending: false })

  if (params.area && params.area !== 'all') {
    query = query.eq('area_id', params.area)
  }
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data: pois } = await query

  // Get all areas for filter dropdown and name resolution
  const { data: areas } = await supabase
    .from('curated_areas')
    .select('id, name, level, parent_area_id')
    .order('name')

  const areaMap: Record<string, { name: string; level: number; parent_area_id: string | null }> = {}
  for (const a of areas ?? []) {
    areaMap[a.id] = { name: a.name, level: a.level, parent_area_id: a.parent_area_id }
  }

  const subAreas = (areas ?? [])
    .filter(a => a.level === 2)
    .map(a => ({ id: a.id, name: a.name }))

  // Resolve macro ID for each POI's sub-area (for drill-down links)
  function getMacroId(areaId: string): string | null {
    const area = areaMap[areaId]
    if (!area) return null
    if (area.level === 1) return areaId
    return area.parent_area_id
  }

  const totalCount = pois?.length ?? 0

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Alla POI:er</h1>
      </div>

      <PoiFilters subAreas={subAreas} />

      <p className="mb-3 text-sm text-gray-500">{totalCount} POI:er</p>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Subområde</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">{'\u2605'}</th>
              <th className="px-4 py-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pois?.map(poi => {
              const subArea = areaMap[poi.area_id]
              const macroId = getMacroId(poi.area_id)
              const detailHref = macroId
                ? `/kurator/omraden/${macroId}/sub/${poi.area_id}/poi/${poi.id}`
                : `/kurator/omraden/${poi.area_id}`

              return (
                <tr key={poi.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={detailHref}
                      className="hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {poi.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{poi.category}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {subArea?.name ?? poi.area_id}
                    {subArea?.parent_area_id && areaMap[subArea.parent_area_id] && (
                      <span className="text-gray-400"> / {areaMap[subArea.parent_area_id].name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={poi.status} /></td>
                  <td className="px-4 py-3 text-center">{poi.is_featured ? '\u2605' : ''}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={detailHref}
                      className="text-sm font-medium hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Redigera
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(!pois || pois.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Inga POI:er matchar filtret.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
