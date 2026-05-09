'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
}

async function requireCurator():
  Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string }; profile: { is_curator: boolean; is_admin: boolean }; error?: never } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Du är inte inloggad' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_curator, is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_curator) return { error: 'Du saknar behörighet för denna åtgärd' }

    return { supabase, user, profile }
  } catch {
    return { error: 'Kunde inte verifiera behörighet' }
  }
}

export async function createPoi(macroId: string, subId: string, formData: FormData) {
  const auth = await requireCurator()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Namn krävs' }

  const category = formData.get('category') as string
  if (!category) return { error: 'Kategori krävs' }

  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  if (isNaN(lat) || isNaN(lng)) return { error: 'Plats (lat/lng) krävs — klicka på kartan' }

  const id = slugify(name)
  if (!id) return { error: 'Kunde inte generera ett giltigt ID från namnet' }

  // Check uniqueness
  const { data: existing } = await supabase
    .from('curated_pois')
    .select('id')
    .eq('id', id)
    .single()

  if (existing) return { error: 'Det finns redan en POI med liknande namn' }

  const tagsStr = (formData.get('character_tags') as string) || ''
  const character_tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []

  const { error } = await supabase.rpc('upsert_curated_poi', {
    p_id: id,
    p_name: name,
    p_area_id: subId,
    p_category: category,
    p_lat: lat,
    p_lng: lng,
    p_character_tags: character_tags,
    p_short_description: (formData.get('short_description') as string) || null,
    p_description: (formData.get('description') as string) || null,
    p_hero_image_url: (formData.get('hero_image_url') as string) || null,
    p_external_url: (formData.get('external_url') as string) || null,
    p_seasonality: (formData.get('seasonality') as string) || 'year_round',
    p_accessibility_note: (formData.get('accessibility_note') as string) || null,
    p_is_featured: formData.get('is_featured') === 'true',
    p_display_priority: parseInt(formData.get('display_priority') as string) || 50,
    p_status: 'draft',
  })

  if (error) return { error: error.message }

  // Auto-assign to natur_kultur collection
  await supabase
    .from('curated_poi_collections')
    .insert({ poi_id: id, collection_id: 'natur_kultur' })

  revalidatePath(`/kurator/omraden/${macroId}/sub/${subId}/poi`)
  revalidatePath('/kurator/poi')
  redirect(`/kurator/omraden/${macroId}/sub/${subId}/poi/${id}`)
}

export async function updatePoi(id: string, macroId: string, subId: string, formData: FormData) {
  const auth = await requireCurator()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Namn krävs' }

  const category = formData.get('category') as string
  if (!category) return { error: 'Kategori krävs' }

  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  if (isNaN(lat) || isNaN(lng)) return { error: 'Plats (lat/lng) krävs' }

  // Preserve current status
  const { data: current } = await supabase
    .from('curated_pois')
    .select('status')
    .eq('id', id)
    .single()

  if (!current) return { error: 'POI hittades inte' }

  const tagsStr = (formData.get('character_tags') as string) || ''
  const character_tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []

  const { error } = await supabase.rpc('upsert_curated_poi', {
    p_id: id,
    p_name: name,
    p_area_id: subId,
    p_category: category,
    p_lat: lat,
    p_lng: lng,
    p_character_tags: character_tags,
    p_short_description: (formData.get('short_description') as string) || null,
    p_description: (formData.get('description') as string) || null,
    p_hero_image_url: (formData.get('hero_image_url') as string) || null,
    p_external_url: (formData.get('external_url') as string) || null,
    p_seasonality: (formData.get('seasonality') as string) || 'year_round',
    p_accessibility_note: (formData.get('accessibility_note') as string) || null,
    p_is_featured: formData.get('is_featured') === 'true',
    p_display_priority: parseInt(formData.get('display_priority') as string) || 50,
    p_status: current.status,
  })

  if (error) return { error: error.message }

  revalidatePath(`/kurator/omraden/${macroId}/sub/${subId}/poi`)
  revalidatePath(`/kurator/omraden/${macroId}/sub/${subId}/poi/${id}`)
  revalidatePath('/kurator/poi')
  return { success: true }
}

export async function deletePoi(id: string, macroId: string, subId: string) {
  const auth = await requireCurator()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  // Delete collection links first
  await supabase
    .from('curated_poi_collections')
    .delete()
    .eq('poi_id', id)

  const { error } = await supabase
    .from('curated_pois')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/kurator/omraden/${macroId}/sub/${subId}/poi`)
  revalidatePath('/kurator/poi')
  return { success: true }
}

export async function transitionPoiStatus(id: string, macroId: string, subId: string, newStatus: string) {
  const auth = await requireCurator()
  if ('error' in auth) return { error: auth.error }
  const { supabase, profile } = auth

  if (newStatus === 'published' && !profile.is_admin) {
    return { error: 'Bara admin kan publicera' }
  }

  const { error } = await supabase
    .from('curated_pois')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/kurator/omraden/${macroId}/sub/${subId}/poi`)
  revalidatePath(`/kurator/omraden/${macroId}/sub/${subId}/poi/${id}`)
  revalidatePath('/kurator/poi')
  return { success: true }
}
