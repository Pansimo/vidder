'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function uploadImage(
  bucket: string,
  path: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  // Auth check via normal client (cookies)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ej inloggad' }

  // Verify curator role
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_curator')
    .eq('id', user.id)
    .single()

  if (!profile?.is_curator) return { error: 'Ej kurator' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'Ingen fil vald' }

  // Use service_role client for storage (bypasses RLS)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await serviceClient.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (error) return { error: error.message }

  const { data } = serviceClient.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl }
}
