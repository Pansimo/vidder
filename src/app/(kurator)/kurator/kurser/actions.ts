'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteCourse(courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('orienteering_courses').delete().eq('id', courseId)
  revalidatePath('/kurator/kurser')
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('orienteering_courses')
    .insert({
      name: formData.get('name') as string,
      course_type: formData.get('course_type') as string,
      description: formData.get('description') as string,
      creator_id: user.id,
      is_public: false,
    })
    .select()
    .single()

  revalidatePath('/kurator/kurser')
  return data
}
