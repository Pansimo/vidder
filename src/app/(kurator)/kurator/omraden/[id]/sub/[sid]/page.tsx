import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '../../../../../_components/Breadcrumb'
import StatusBadge from '../../../../../_components/StatusBadge'
import OmradeForm from '../../../OmradeForm'

interface Props {
  params: Promise<{ id: string; sid: string }>
}

export default async function RedigeraSubOmradePage({ params }: Props) {
  const { id, sid } = await params
  const supabase = await createClient()

  const { data: macro } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!macro) notFound()

  const { data: sub } = await supabase
    .from('curated_areas')
    .select('*')
    .eq('id', sid)
    .single()

  if (!sub) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  const { count: poiCount } = await supabase
    .from('curated_pois')
    .select('*', { count: 'exact', head: true })
    .eq('area_id', sid)

  const { data: macroAreas } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('level', 1)
    .order('name')

  // Extract centroid
  let centroidLat: number | null = null
  let centroidLng: number | null = null
  if (sub.centroid) {
    const { data: centroidData } = await supabase.rpc('get_area_centroid', { area_id: sid })
    if (centroidData && typeof centroidData === 'object') {
      centroidLat = (centroidData as { lat: number }).lat
      centroidLng = (centroidData as { lng: number }).lng
    }
  }

  const areaForForm = {
    id: sub.id,
    name: sub.name,
    level: sub.level,
    parent_area_id: sub.parent_area_id,
    type: sub.type,
    character_tags: sub.character_tags ?? [],
    short_intro: sub.short_intro,
    character: sub.character,
    hero_image_url: sub.hero_image_url,
    bbox_sw_lat: sub.bbox_sw_lat,
    bbox_sw_lng: sub.bbox_sw_lng,
    bbox_ne_lat: sub.bbox_ne_lat,
    bbox_ne_lng: sub.bbox_ne_lng,
    centroid_lat: centroidLat,
    centroid_lng: centroidLng,
    naming_priority: sub.naming_priority,
    status: sub.status as 'draft' | 'review' | 'published' | 'archived',
    ready_for_app: sub.ready_for_app,
  }

  return (
    <div className="p-6 max-w-6xl">
      <Breadcrumb items={[
        { label: 'Områden', href: '/kurator/omraden' },
        { label: macro.name, href: `/kurator/omraden/${id}` },
        { label: 'Subområden', href: `/kurator/omraden/${id}/sub` },
        { label: sub.name },
      ]} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{sub.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={sub.status} />
            <span className="text-sm text-gray-500">Subområde · {sub.type} · i {macro.name}</span>
          </div>
        </div>
        <Link
          href={`/kurator/omraden/${id}/sub/${sid}/poi`}
          className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          POI:er ({poiCount ?? 0})
        </Link>
      </div>

      <OmradeForm
        area={areaForForm}
        mode="edit"
        isAdmin={profile?.is_admin ?? false}
        parentOptions={macroAreas ?? []}
      />
    </div>
  )
}
