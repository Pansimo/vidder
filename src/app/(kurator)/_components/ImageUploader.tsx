'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  bucket?: string
  pathPrefix: string
  currentUrl: string | null
  onUploaded: (url: string) => void
}

export default function ImageUploader({
  bucket = 'curated-images',
  pathPrefix,
  currentUrl,
  onUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)

    // Debug: log session state
    const { data: { session } } = await supabase.auth.getSession()
    console.log('[ImageUploader] Session exists:', !!session)
    console.log('[ImageUploader] Access token (first 20):', session?.access_token?.slice(0, 20))
    console.log('[ImageUploader] User ID:', session?.user?.id)
    console.log('[ImageUploader] User role:', session?.user?.role)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${pathPrefix}hero.${ext}`
    console.log('[ImageUploader] Upload path:', path, 'Bucket:', bucket)

    // Test 1: supabase-js upload
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    console.log('[ImageUploader] Upload result:', { error: uploadError, data: uploadData })

    if (uploadError) {
      // Test 2: raw fetch fallback to diagnose
      console.log('[ImageUploader] supabase-js failed, trying raw fetch...')
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`
      const fetchRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
          'x-upsert': 'true',
        },
        body: file,
      })
      const fetchBody = await fetchRes.text()
      console.log('[ImageUploader] Raw fetch status:', fetchRes.status, 'body:', fetchBody)

      if (fetchRes.ok) {
        console.log('[ImageUploader] Raw fetch SUCCEEDED — supabase-js bug')
        // Use the raw fetch result
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        setPreview(data.publicUrl)
        onUploaded(data.publicUrl)
        setUploading(false)
        return
      }

      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    setPreview(data.publicUrl)
    onUploaded(data.publicUrl)
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex h-20 w-32 items-center justify-center rounded border border-gray-200 bg-gray-100 overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="Hero" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-gray-400">Ingen bild</span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary rounded-md px-3 py-1.5 text-sm"
          >
            {uploading ? 'Laddar upp...' : 'Ladda upp...'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
