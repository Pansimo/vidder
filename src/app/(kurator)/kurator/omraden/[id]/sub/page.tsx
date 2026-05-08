import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StatusBadge from '../../../../_components/StatusBadge'
import Breadcrumb from '../../../../_components/Breadcrumb'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SubOmradenPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: macro } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!macro) notFound()

  const { data: subs } = await supabase
    .from('curated_areas')
    .select('id, name, type, status, naming_priority')
    .eq('parent_area_id', id)
    .eq('level', 2)
    .order('naming_priority', { ascending: false })

  // POI counts per sub
  const { data: pois } = await supabase
    .from('curated_pois')
    .select('area_id')

  const poiCountByArea: Record<string, number> = {}
  for (const poi of pois ?? []) {
    poiCountByArea[poi.area_id] = (poiCountByArea[poi.area_id] ?? 0) + 1
  }

  return (
    <div className="p-6">
      <Breadcrumb items={[
        { label: 'Områden', href: '/kurator/omraden' },
        { label: macro.name, href: `/kurator/omraden/${id}` },
        { label: 'Subområden' },
      ]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subområden i {macro.name}</h1>
        <Link
          href={`/kurator/omraden/${id}/sub/ny`}
          className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          Nytt subområde
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3">Typ</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">POI:er</th>
              <th className="px-4 py-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subs?.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/kurator/omraden/${id}/sub/${sub.id}`}
                    className="hover:underline"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {sub.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{sub.type}</td>
                <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                <td className="px-4 py-3 text-center text-gray-600">{poiCountByArea[sub.id] ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/kurator/omraden/${id}/sub/${sub.id}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Redigera
                    </Link>
                    <Link
                      href={`/kurator/omraden/${id}/sub/${sub.id}/poi`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      POI:er
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {(!subs || subs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Inga subområden ännu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
