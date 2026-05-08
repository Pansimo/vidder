import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '../../../_components/Breadcrumb'
import StatusBadge from '../../../_components/StatusBadge'
import OmradeForm from '../OmradeForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RedigeraOmradePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: area } = await supabase
    .from('curated_areas')
    .select('*')
    .eq('id', id)
    .single()

  if (!area) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  // Count sub-areas
  const { count: subCount } = await supabase
    .from('curated_areas')
    .select('*', { count: 'exact', head: true })
    .eq('parent_area_id', id)

  // Count POIs (direct for sub-areas, via sub-areas for macro)
  let poiCount = 0
  if (area.level === 2) {
    const { count } = await supabase
      .from('curated_pois')
      .select('*', { count: 'exact', head: true })
      .eq('area_id', id)
    poiCount = count ?? 0
  } else {
    // Get sub-area ids, then count POIs
    const { data: subs } = await supabase
      .from('curated_areas')
      .select('id')
      .eq('parent_area_id', id)

    if (subs && subs.length > 0) {
      const { count } = await supabase
        .from('curated_pois')
        .select('*', { count: 'exact', head: true })
        .in('area_id', subs.map(s => s.id))
      poiCount = count ?? 0
    }
  }

  // Get macro areas for parent select (for create mode, not needed for edit but harmless)
  const { data: macroAreas } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('level', 1)
    .order('name')

  // Extract centroid lat/lng from geography
  let centroidLat: number | null = null
  let centroidLng: number | null = null
  if (area.centroid) {
    // Supabase returns geography as GeoJSON or WKT — query lat/lng via SQL
    const { data: centroidData } = await supabase
      .rpc('get_area_centroid', { area_id: id })

    // Fallback: try parsing if RPC doesn't exist yet
    if (centroidData && typeof centroidData === 'object') {
      centroidLat = (centroidData as { lat: number }).lat
      centroidLng = (centroidData as { lng: number }).lng
    }
  }

  // Build breadcrumb based on level
  const breadcrumbItems = []
  if (area.level === 2 && area.parent_area_id) {
    const { data: parent } = await supabase
      .from('curated_areas')
      .select('id, name')
      .eq('id', area.parent_area_id)
      .single()

    breadcrumbItems.push({ label: 'Områden', href: '/kurator/omraden' })
    if (parent) {
      breadcrumbItems.push({ label: parent.name, href: `/kurator/omraden/${parent.id}` })
      breadcrumbItems.push({ label: 'Subområden', href: `/kurator/omraden/${parent.id}/sub` })
    }
    breadcrumbItems.push({ label: area.name })
  } else {
    breadcrumbItems.push({ label: 'Områden', href: '/kurator/omraden' })
    breadcrumbItems.push({ label: area.name })
  }

  const areaForForm = {
    id: area.id,
    name: area.name,
    level: area.level,
    parent_area_id: area.parent_area_id,
    type: area.type,
    character_tags: area.character_tags ?? [],
    short_intro: area.short_intro,
    character: area.character,
    hero_image_url: area.hero_image_url,
    bbox_sw_lat: area.bbox_sw_lat,
    bbox_sw_lng: area.bbox_sw_lng,
    bbox_ne_lat: area.bbox_ne_lat,
    bbox_ne_lng: area.bbox_ne_lng,
    centroid_lat: centroidLat,
    centroid_lng: centroidLng,
    naming_priority: area.naming_priority,
    status: area.status as 'draft' | 'review' | 'published' | 'archived',
    ready_for_app: area.ready_for_app,
  }

  return (
    <div className="p-6 max-w-6xl">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{area.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={area.status} />
            <span className="text-sm text-gray-500">
              {area.level === 1 ? 'Makroområde' : 'Subområde'} · {area.type}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {area.level === 1 && (
            <Link
              href={`/kurator/omraden/${id}/sub`}
              className="btn-secondary rounded-md px-4 py-2 text-sm font-medium"
            >
              Subområden ({subCount ?? 0})
            </Link>
          )}
          {area.level === 2 && area.parent_area_id && (
            <Link
              href={`/kurator/omraden/${area.parent_area_id}/sub/${id}/poi`}
              className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
            >
              POI:er ({poiCount})
            </Link>
          )}
        </div>
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
