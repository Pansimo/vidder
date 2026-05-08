import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Breadcrumb from '../../../../../../../_components/Breadcrumb'
import PoiForm from '../PoiForm'

interface Props {
  params: Promise<{ id: string; sid: string }>
}

export default async function NyPoiPage({ params }: Props) {
  const { id, sid } = await params
  const supabase = await createClient()

  const { data: macro } = await supabase
    .from('curated_areas')
    .select('id, name')
    .eq('id', id)
    .single()

  const { data: sub } = await supabase
    .from('curated_areas')
    .select('id, name, bbox_sw_lat, bbox_sw_lng, bbox_ne_lat, bbox_ne_lng')
    .eq('id', sid)
    .single()

  if (!macro || !sub) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  // Default center to sub-area bbox center if available
  let defaultLat: number | null = null
  let defaultLng: number | null = null
  if (sub.bbox_sw_lat != null && sub.bbox_ne_lat != null) {
    defaultLat = (sub.bbox_sw_lat + sub.bbox_ne_lat) / 2
    defaultLng = (sub.bbox_sw_lng + sub.bbox_ne_lng) / 2
  } else {
    // Try centroid
    const { data: centroidData } = await supabase.rpc('get_area_centroid', { area_id: sid })
    if (centroidData && typeof centroidData === 'object') {
      defaultLat = (centroidData as { lat: number }).lat
      defaultLng = (centroidData as { lng: number }).lng
    }
  }

  return (
    <div className="p-6 max-w-7xl">
      <Breadcrumb items={[
        { label: 'Områden', href: '/kurator/omraden' },
        { label: macro.name, href: `/kurator/omraden/${id}` },
        { label: 'Subområden', href: `/kurator/omraden/${id}/sub` },
        { label: sub.name, href: `/kurator/omraden/${id}/sub/${sid}` },
        { label: 'POI:er', href: `/kurator/omraden/${id}/sub/${sid}/poi` },
        { label: 'Ny POI' },
      ]} />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Ny POI i {sub.name}</h1>
      <PoiForm
        mode="create"
        macroId={id}
        subId={sid}
        isAdmin={profile?.is_admin ?? false}
        defaultLat={defaultLat}
        defaultLng={defaultLng}
        defaultZoom={defaultLat != null ? 10 : undefined}
      />
    </div>
  )
}
