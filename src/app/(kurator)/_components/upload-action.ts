'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadImage(
  bucket: string,
  path: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ej inloggad' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'Ingen fil vald' }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl }
}
