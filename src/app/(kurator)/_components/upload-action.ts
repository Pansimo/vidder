'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
}

export async function uploadImage(
  bucket: string,
  path: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
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

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { error: 'SUPABASE_SERVICE_ROLE_KEY saknas i miljövariabler' }
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Derive contentType from file extension (file.type may be lost in Server Action serialization)
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME_MAP[ext] || file.type || 'application/octet-stream'

    // Delete old hero.* files in the same folder before uploading
    const folder = path.substring(0, path.lastIndexOf('/'))
    if (folder) {
      const { data: existing } = await serviceClient.storage
        .from(bucket)
        .list(folder)

      if (existing) {
        const heroFiles = existing.filter(f => f.name.startsWith('hero.'))
        if (heroFiles.length > 0) {
          await serviceClient.storage
            .from(bucket)
            .remove(heroFiles.map(f => `${folder}/${f.name}`))
        }
      }
    }

    // Convert File to Buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error } = await serviceClient.storage
      .from(bucket)
      .upload(path, buffer, {
        upsert: true,
        contentType,
      })

    if (error) return { error: error.message }

    const { data: urlData } = serviceClient.storage.from(bucket).getPublicUrl(path)
    return { url: urlData.publicUrl }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Okänt fel vid uppladdning' }
  }
}

export async function saveHeroImageUrl(
  table: 'curated_areas' | 'curated_pois',
  id: string,
  url: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ej inloggad' }

  const { error } = await supabase
    .from(table)
    .update({ hero_image_url: url })
    .eq('id', id)

  if (error) return { error: error.message }
  return {}
}
