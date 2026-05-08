'use client'

import { useState, useRef } from 'react'
import { uploadImage } from './upload-action'

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

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${pathPrefix}hero.${ext}`

    const formData = new FormData()
    formData.set('file', file)

    const result = await uploadImage(bucket, path, formData)

    if (result.error) {
      setError(result.error)
      setUploading(false)
      return
    }

    if (result.url) {
      setPreview(result.url)
      onUploaded(result.url)
    }
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
