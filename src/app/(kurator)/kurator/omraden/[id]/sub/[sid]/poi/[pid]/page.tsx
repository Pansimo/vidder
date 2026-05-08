import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Breadcrumb from '../../../../../../../_components/Breadcrumb'
import StatusBadge from '../../../../../../../_components/StatusBadge'
import PoiForm from '../PoiForm'

interface Props {
  params: Promise<{ id: string; sid: string; pid: string }>
}

export default async function RedigeraPoiPage({ params }: Props) {
  const { id, sid, pid } = await params
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

  const { data: poi } = await supabase
    .from('curated_pois')
    .select('*')
    .eq('id', pid)
    .single()

  if (!macro || !sub || !poi) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  const poiForForm = {
    id: poi.id,
    name: poi.name,
    area_id: poi.area_id,
    category: poi.category,
    lat: poi.lat,
    lng: poi.lng,
    character_tags: poi.character_tags ?? [],
    short_description: poi.short_description,
    description: poi.description,
    hero_image_url: poi.hero_image_url,
    external_url: poi.external_url,
    seasonality: poi.seasonality,
    accessibility_note: poi.accessibility_note,
    is_featured: poi.is_featured,
    display_priority: poi.display_priority,
    status: poi.status as 'draft' | 'review' | 'published' | 'archived',
  }

  return (
    <div className="p-6 max-w-7xl">
      <Breadcrumb items={[
        { label: 'Områden', href: '/kurator/omraden' },
        { label: macro.name, href: `/kurator/omraden/${id}` },
        { label: 'Subområden', href: `/kurator/omraden/${id}/sub` },
        { label: sub.name, href: `/kurator/omraden/${id}/sub/${sid}` },
        { label: 'POI:er', href: `/kurator/omraden/${id}/sub/${sid}/poi` },
        { label: poi.name },
      ]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{poi.name}</h1>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status={poi.status} />
          <span className="text-sm text-gray-500">POI · {poi.category} · i {sub.name}</span>
        </div>
      </div>

      <PoiForm
        poi={poiForForm}
        mode="edit"
        macroId={id}
        subId={sid}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  )
}
