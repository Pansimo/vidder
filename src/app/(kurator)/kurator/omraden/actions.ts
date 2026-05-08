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

async function requireCurator() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ej inloggad')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_curator, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_curator) throw new Error('Ej kurator')

  return { supabase, user, profile }
}

export async function createArea(formData: FormData) {
  const { supabase } = await requireCurator()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Namn krävs' }

  const level = parseInt(formData.get('level') as string)
  if (level !== 1 && level !== 2) return { error: 'Ogiltig nivå' }

  const parentAreaId = (formData.get('parent_area_id') as string) || null
  if (level === 2 && !parentAreaId) return { error: 'Subområde kräver ett makroområde' }

  const id = slugify(name)
  if (!id) return { error: 'Kunde inte generera ett giltigt ID från namnet' }

  // Check uniqueness
  const { data: existing } = await supabase
    .from('curated_areas')
    .select('id')
    .eq('id', id)
    .single()

  if (existing) return { error: 'Det finns redan ett område med liknande namn' }

  const type = formData.get('type') as string || 'mixed'
  const tagsStr = (formData.get('character_tags') as string) || ''
  const character_tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []
  const naming_priority = parseInt(formData.get('naming_priority') as string) || 50
  const short_intro = (formData.get('short_intro') as string) || null
  const character = (formData.get('character') as string) || null
  const hero_image_url = (formData.get('hero_image_url') as string) || null

  const bboxSwLat = parseFloatOrNull(formData.get('bbox_sw_lat') as string)
  const bboxSwLng = parseFloatOrNull(formData.get('bbox_sw_lng') as string)
  const bboxNeLat = parseFloatOrNull(formData.get('bbox_ne_lat') as string)
  const bboxNeLng = parseFloatOrNull(formData.get('bbox_ne_lng') as string)
  const centroidLat = parseFloatOrNull(formData.get('centroid_lat') as string)
  const centroidLng = parseFloatOrNull(formData.get('centroid_lng') as string)

  const { error } = await supabase.rpc('upsert_curated_area', {
    p_id: id,
    p_name: name,
    p_level: level,
    p_parent_area_id: parentAreaId,
    p_type: type,
    p_character_tags: character_tags,
    p_short_intro: short_intro,
    p_character: character,
    p_hero_image_url: hero_image_url,
    p_bbox_sw_lat: bboxSwLat,
    p_bbox_sw_lng: bboxSwLng,
    p_bbox_ne_lat: bboxNeLat,
    p_bbox_ne_lng: bboxNeLng,
    p_centroid_lat: centroidLat,
    p_centroid_lng: centroidLng,
    p_naming_priority: naming_priority,
    p_status: 'draft',
    p_ready_for_app: false,
  })

  if (error) return { error: error.message }

  revalidatePath('/kurator/omraden')
  redirect(`/kurator/omraden/${id}`)
}

export async function updateArea(id: string, formData: FormData) {
  const { supabase } = await requireCurator()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Namn krävs' }

  const type = formData.get('type') as string || 'mixed'
  const tagsStr = (formData.get('character_tags') as string) || ''
  const character_tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []
  const naming_priority = parseInt(formData.get('naming_priority') as string) || 50
  const short_intro = (formData.get('short_intro') as string) || null
  const character = (formData.get('character') as string) || null
  const hero_image_url = (formData.get('hero_image_url') as string) || null

  const bboxSwLat = parseFloatOrNull(formData.get('bbox_sw_lat') as string)
  const bboxSwLng = parseFloatOrNull(formData.get('bbox_sw_lng') as string)
  const bboxNeLat = parseFloatOrNull(formData.get('bbox_ne_lat') as string)
  const bboxNeLng = parseFloatOrNull(formData.get('bbox_ne_lng') as string)
  const centroidLat = parseFloatOrNull(formData.get('centroid_lat') as string)
  const centroidLng = parseFloatOrNull(formData.get('centroid_lng') as string)

  // Fetch current status to preserve it
  const { data: current } = await supabase
    .from('curated_areas')
    .select('status, level, parent_area_id, ready_for_app')
    .eq('id', id)
    .single()

  if (!current) return { error: 'Området hittades inte' }

  const { error } = await supabase.rpc('upsert_curated_area', {
    p_id: id,
    p_name: name,
    p_level: current.level,
    p_parent_area_id: current.parent_area_id,
    p_type: type,
    p_character_tags: character_tags,
    p_short_intro: short_intro,
    p_character: character,
    p_hero_image_url: hero_image_url,
    p_bbox_sw_lat: bboxSwLat,
    p_bbox_sw_lng: bboxSwLng,
    p_bbox_ne_lat: bboxNeLat,
    p_bbox_ne_lng: bboxNeLng,
    p_centroid_lat: centroidLat,
    p_centroid_lng: centroidLng,
    p_naming_priority: naming_priority,
    p_status: current.status,
    p_ready_for_app: current.ready_for_app,
  })

  if (error) return { error: error.message }

  revalidatePath('/kurator/omraden')
  revalidatePath(`/kurator/omraden/${id}`)
  return { success: true }
}

export async function deleteArea(id: string) {
  const { supabase } = await requireCurator()

  // Check for sub-areas
  const { count: subCount } = await supabase
    .from('curated_areas')
    .select('*', { count: 'exact', head: true })
    .eq('parent_area_id', id)

  if (subCount && subCount > 0) {
    return { error: `Kan inte radera — området har ${subCount} subområden. Radera dem först.` }
  }

  // Check for POIs
  const { count: poiCount } = await supabase
    .from('curated_pois')
    .select('*', { count: 'exact', head: true })
    .eq('area_id', id)

  if (poiCount && poiCount > 0) {
    return { error: `Kan inte radera — området har ${poiCount} POI:er. Radera dem först.` }
  }

  const { error } = await supabase
    .from('curated_areas')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/kurator/omraden')
  return { success: true }
}

export async function transitionStatus(id: string, newStatus: string) {
  const { supabase, profile } = await requireCurator()

  if (newStatus === 'published' && !profile.is_admin) {
    return { error: 'Bara admin kan publicera' }
  }

  const { error } = await supabase
    .from('curated_areas')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/kurator/omraden')
  revalidatePath(`/kurator/omraden/${id}`)
  return { success: true }
}

export async function setReadyForApp(id: string, ready: boolean) {
  const { supabase, profile } = await requireCurator()

  if (!profile.is_admin) return { error: 'Bara admin kan ändra app-status' }

  const { error } = await supabase
    .from('curated_areas')
    .update({ ready_for_app: ready })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/kurator/omraden')
  revalidatePath(`/kurator/omraden/${id}`)
  return { success: true }
}

function parseFloatOrNull(value: string | null): number | null {
  if (!value || value.trim() === '') return null
  const n = parseFloat(value)
  return isNaN(n) ? null : n
}
