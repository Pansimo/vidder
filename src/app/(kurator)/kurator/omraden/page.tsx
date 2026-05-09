import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '../../_components/StatusBadge'
import SortableHeader from '../../_components/SortableHeader'
import OmradenFilters from './OmradenFilters'
import { deleteArea } from './actions'

interface Props {
  searchParams: Promise<{ level?: string; status?: string; q?: string; sort?: string; dir?: string }>
}

export default async function OmradenPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('curated_areas')
    .select('id, name, level, parent_area_id, type, status, ready_for_app, naming_priority, updated_at')

  if (params.level && params.level !== 'all') {
    query = query.eq('level', parseInt(params.level))
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.q) {
    query = query.ilike('name', `%${params.q}%`)
  }

  // Sorting
  const sortMap: Record<string, string> = {
    name: 'name',
    status: 'status',
    updated: 'updated_at',
    priority: 'naming_priority',
  }
  const sortCol = sortMap[params.sort ?? ''] ?? 'name'
  const sortDir = params.dir ?? 'asc'
  query = query.order(sortCol, { ascending: sortDir === 'asc' })

  const { data: areas } = await query

  // Get counts for stats
  const { count: totalCount } = await supabase
    .from('curated_areas')
    .select('*', { count: 'exact', head: true })
  const { count: publishedCount } = await supabase
    .from('curated_areas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
  const { count: draftCount } = await supabase
    .from('curated_areas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft')
  const { count: readyCount } = await supabase
    .from('curated_areas')
    .select('*', { count: 'exact', head: true })
    .eq('ready_for_app', true)

  // Get sub-area counts per macro
  const { data: subAreas } = await supabase
    .from('curated_areas')
    .select('id, parent_area_id')
    .eq('level', 2)

  const subCountByParent: Record<string, number> = {}
  for (const sub of subAreas ?? []) {
    if (sub.parent_area_id) {
      subCountByParent[sub.parent_area_id] = (subCountByParent[sub.parent_area_id] ?? 0) + 1
    }
  }

  // Get POI counts per area
  const { data: pois } = await supabase
    .from('curated_pois')
    .select('area_id')

  const poiCountByArea: Record<string, number> = {}
  for (const poi of pois ?? []) {
    poiCountByArea[poi.area_id] = (poiCountByArea[poi.area_id] ?? 0) + 1
  }

  function getPoiCount(area: { id: string; level: number }): number {
    if (area.level === 2) return poiCountByArea[area.id] ?? 0
    let total = 0
    for (const sub of subAreas ?? []) {
      if (sub.parent_area_id === area.id) {
        total += poiCountByArea[sub.id] ?? 0
      }
    }
    return total
  }

  // Map parent names (from all areas, not just filtered)
  const { data: allAreas } = await supabase
    .from('curated_areas')
    .select('id, name')

  const areaNames: Record<string, string> = {}
  for (const a of allAreas ?? []) {
    areaNames[a.id] = a.name
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Områden</h1>
        <Link
          href="/kurator/omraden/ny"
          className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          Nytt område
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard label="Totalt" value={totalCount ?? 0} />
        <StatCard label="Publicerade" value={publishedCount ?? 0} />
        <StatCard label="Utkast" value={draftCount ?? 0} />
        <StatCard label="Aktiverade i app" value={readyCount ?? 0} />
      </div>

      <OmradenFilters />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <SortableHeader column="name" label="Namn" />
              <th className="px-4 py-3">Nivå</th>
              <th className="px-4 py-3">Typ</th>
              <SortableHeader column="status" label="Status" />
              <th className="px-4 py-3 text-center">Sub</th>
              <th className="px-4 py-3 text-center">POI:er</th>
              <SortableHeader column="priority" label="Prio" />
              <th className="px-4 py-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {areas?.map(area => (
              <tr key={area.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link
                    href={`/kurator/omraden/${area.id}`}
                    className="hover:underline"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {area.name}
                  </Link>
                  {area.level === 2 && area.parent_area_id && (
                    <span className="ml-2 text-xs text-gray-400">
                      i {areaNames[area.parent_area_id] ?? area.parent_area_id}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{area.level === 1 ? 'Makro' : 'Sub'}</td>
                <td className="px-4 py-3 text-gray-600">{area.type}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={area.status} />
                  {area.ready_for_app && (
                    <span className="ml-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                      app
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {area.level === 1 ? (subCountByParent[area.id] ?? 0) : '\u2014'}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{getPoiCount(area)}</td>
                <td className="px-4 py-3 text-center text-gray-600">{area.naming_priority}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/kurator/omraden/${area.id}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Redigera
                    </Link>
                    <DeleteButton areaId={area.id} areaName={area.name} />
                  </div>
                </td>
              </tr>
            ))}
            {(!areas || areas.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Inga områden matchar filtret.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function DeleteButton({ areaId, areaName }: { areaId: string; areaName: string }) {
  async function handleDelete() {
    'use server'
    await deleteArea(areaId)
  }

  return (
    <form action={handleDelete}>
      <button
        type="submit"
        className="btn-danger rounded-md px-2 py-0.5 text-xs font-medium"
      >
        Ta bort
      </button>
    </form>
  )
}
