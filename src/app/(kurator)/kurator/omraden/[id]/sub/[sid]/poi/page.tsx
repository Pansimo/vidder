import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StatusBadge from '../../../../../../_components/StatusBadge'
import Breadcrumb from '../../../../../../_components/Breadcrumb'
import { deletePoi } from './actions'

interface Props {
  params: Promise<{ id: string; sid: string }>
}

export default async function PoiListPage({ params }: Props) {
  const { id, sid } = await params
  const supabase = await createClient()

  const { data: macro } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('id', id)
    .single()

  const { data: sub } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('id', sid)
    .single()

  if (!macro || !sub) notFound()

  const { data: pois } = await supabase
    .from('curated_pois')
    .select('id, name, category, status, is_featured, display_priority, short_description')
    .eq('area_id', sid)
    .order('display_priority', { ascending: false })

  return (
    <div className="p-6">
      <Breadcrumb items={[
        { label: 'Områden', href: '/kurator/omraden' },
        { label: macro.name, href: `/kurator/omraden/${id}` },
        { label: 'Subområden', href: `/kurator/omraden/${id}/sub` },
        { label: sub.name, href: `/kurator/omraden/${id}/sub/${sid}` },
        { label: 'POI:er' },
      ]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">POI:er i {sub.name}</h1>
        <Link
          href={`/kurator/omraden/${id}/sub/${sid}/poi/ny`}
          className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          Ny POI
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Featured</th>
              <th className="px-4 py-3 text-center">Prio</th>
              <th className="px-4 py-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pois?.map(poi => (
              <tr key={poi.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/kurator/omraden/${id}/sub/${sid}/poi/${poi.id}`}
                    className="hover:underline"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {poi.name}
                  </Link>
                  {poi.short_description && (
                    <p className="mt-0.5 text-xs text-gray-500">{poi.short_description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{poi.category}</td>
                <td className="px-4 py-3"><StatusBadge status={poi.status} /></td>
                <td className="px-4 py-3 text-center">{poi.is_featured ? '\u2605' : '\u2014'}</td>
                <td className="px-4 py-3 text-center text-gray-600">{poi.display_priority}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/kurator/omraden/${id}/sub/${sid}/poi/${poi.id}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Redigera
                    </Link>
                    <DeletePoiButton poiId={poi.id} poiName={poi.name} macroId={id} subId={sid} />
                  </div>
                </td>
              </tr>
            ))}
            {(!pois || pois.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Inga POI:er ännu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DeletePoiButton({ poiId, poiName, macroId, subId }: {
  poiId: string; poiName: string; macroId: string; subId: string
}) {
  async function handleDelete() {
    'use server'
    await deletePoi(poiId, macroId, subId)
  }

  return (
    <form action={handleDelete}>
      <button type="submit" className="btn-danger rounded-md px-2 py-0.5 text-xs font-medium">
        Ta bort
      </button>
    </form>
  )
}
