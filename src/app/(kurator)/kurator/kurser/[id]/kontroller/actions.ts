'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addControl(courseId: string, lat: number, lng: number, orderIndex: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('orienteering_controls')
    .insert({
      course_id: courseId,
      lat,
      lng,
      order_index: orderIndex,
      name: '',
      description: '',
      hint: '',
      difficulty: 'easy',
      radius_m: 25,
      requires_photo: false,
      accessibility: 'terrain',
    })
    .select()
    .single()

  revalidatePath(`/kurator/kurser/${courseId}/kontroller`)
  return data
}

export async function updateControl(controlId: string, courseId: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('orienteering_controls')
    .update(data)
    .eq('id', controlId)

  revalidatePath(`/kurator/kurser/${courseId}/kontroller`)
}

export async function deleteControl(controlId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('orienteering_controls')
    .delete()
    .eq('id', controlId)

  revalidatePath(`/kurator/kurser/${courseId}/kontroller`)
}

export async function reorderControls(courseId: string, orderedIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('orienteering_controls')
      .update({ order_index: index })
      .eq('id', id)
  )

  await Promise.all(updates)
  revalidatePath(`/kurator/kurser/${courseId}/kontroller`)
}
