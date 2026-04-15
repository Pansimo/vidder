'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSubCourse(courseId: string, name: string, description: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get next sort_order
  const { data: existing } = await supabase
    .from('orienteering_sub_courses')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data } = await supabase
    .from('orienteering_sub_courses')
    .insert({
      course_id: courseId,
      name,
      description: description || null,
      sort_order: nextOrder,
    })
    .select()
    .single()

  revalidatePath(`/kurator/kurser/${courseId}/delbanor`)
  return data
}

export async function updateSubCourse(
  subCourseId: string,
  courseId: string,
  data: { name?: string; description?: string | null },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('orienteering_sub_courses')
    .update(data)
    .eq('id', subCourseId)

  revalidatePath(`/kurator/kurser/${courseId}/delbanor`)
}

export async function deleteSubCourse(subCourseId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Unlink controls from this sub-course
  await supabase
    .from('orienteering_controls')
    .update({ sub_course_id: null })
    .eq('sub_course_id', subCourseId)

  await supabase
    .from('orienteering_sub_courses')
    .delete()
    .eq('id', subCourseId)

  revalidatePath(`/kurator/kurser/${courseId}/delbanor`)
}
