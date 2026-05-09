'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import MapPicker from '../../_components/MapPicker'
import ImageUploader from '../../_components/ImageUploader'
import StatusBadge from '../../_components/StatusBadge'
import StatusFlow from '../../_components/StatusFlow'
import DeleteConfirmDialog from '../../_components/DeleteConfirmDialog'
import { createArea, updateArea, deleteArea, transitionStatus, setReadyForApp } from './actions'

const TYPES = ['urban', 'coastal', 'forest', 'lake', 'mountain', 'island', 'arctic', 'mixed']

interface Area {
  id: string
  name: string
  level: number
  parent_area_id: string | null
  type: string
  character_tags: string[]
  short_intro: string | null
  character: string | null
  hero_image_url: string | null
  bbox_sw_lat: number | null
  bbox_sw_lng: number | null
  bbox_ne_lat: number | null
  bbox_ne_lng: number | null
  centroid_lat: number | null
  centroid_lng: number | null
  naming_priority: number
  status: 'draft' | 'review' | 'published' | 'archived'
  ready_for_app: boolean
}

interface ParentOption {
  id: string
  name: string
}

interface Props {
  area?: Area
  mode: 'create' | 'edit'
  isAdmin: boolean
  parentOptions: ParentOption[]
  defaultLevel?: number
  defaultParentId?: string
}

export default function OmradeForm({ area, mode, isAdmin, parentOptions, defaultLevel, defaultParentId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [centroidLat, setCentroidLat] = useState<number | null>(area?.centroid_lat ?? null)
  const [centroidLng, setCentroidLng] = useState<number | null>(area?.centroid_lng ?? null)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(area?.hero_image_url ?? null)
  const [bboxSwLat, setBboxSwLat] = useState<number | null>(area?.bbox_sw_lat ?? null)
  const [bboxSwLng, setBboxSwLng] = useState<number | null>(area?.bbox_sw_lng ?? null)
  const [bboxNeLat, setBboxNeLat] = useState<number | null>(area?.bbox_ne_lat ?? null)
  const [bboxNeLng, setBboxNeLng] = useState<number | null>(area?.bbox_ne_lng ?? null)

  function handleSubmit(formData: FormData) {
    // Inject client-managed values
    formData.set('centroid_lat', centroidLat?.toString() ?? '')
    formData.set('centroid_lng', centroidLng?.toString() ?? '')
    formData.set('hero_image_url', heroImageUrl ?? '')
    formData.set('bbox_sw_lat', bboxSwLat?.toString() ?? '')
    formData.set('bbox_sw_lng', bboxSwLng?.toString() ?? '')
    formData.set('bbox_ne_lat', bboxNeLat?.toString() ?? '')
    formData.set('bbox_ne_lng', bboxNeLng?.toString() ?? '')

    startTransition(async () => {
      setError(null)
      setSaved(false)

      const result = mode === 'create'
        ? await createArea(formData)
        : await updateArea(area!.id, formData)

      if (result && 'error' in result && typeof result.error === 'string') {
        setError(result.error)
      } else if (mode === 'edit') {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
      // create redirects via server action
    })
  }

  function handleStatusTransition(newStatus: 'draft' | 'review' | 'published' | 'archived') {
    if (!area) return
    startTransition(async () => {
      setError(null)
      const result = await transitionStatus(area.id, newStatus)
      if (result && 'error' in result && typeof result.error === 'string') setError(result.error)
      else router.refresh()
    })
  }

  function handleReadyForApp(ready: boolean) {
    if (!area) return
    startTransition(async () => {
      setError(null)
      const result = await setReadyForApp(area.id, ready)
      if (result && 'error' in result && typeof result.error === 'string') setError(result.error)
      else router.refresh()
    })
  }

  function handleDelete() {
    if (!area) return
    startTransition(async () => {
      setError(null)
      const result = await deleteArea(area.id)
      if (result && 'error' in result && typeof result.error === 'string') {
        setError(result.error)
      } else {
        router.push('/kurator/omraden')
      }
    })
  }

  // Auto-compute centroid from bbox midpoint when bbox changes
  function handleBboxChange(field: string, value: string) {
    const n = value === '' ? null : parseFloat(value)
    let sw_lat = bboxSwLat, sw_lng = bboxSwLng, ne_lat = bboxNeLat, ne_lng = bboxNeLng
    if (field === 'sw_lat') { setBboxSwLat(n); sw_lat = n }
    if (field === 'sw_lng') { setBboxSwLng(n); sw_lng = n }
    if (field === 'ne_lat') { setBboxNeLat(n); ne_lat = n }
    if (field === 'ne_lng') { setBboxNeLng(n); ne_lng = n }

    // Auto-set centroid to bbox center if all 4 values present and centroid not yet set
    if (sw_lat != null && sw_lng != null && ne_lat != null && ne_lng != null) {
      if (centroidLat == null && centroidLng == null) {
        setCentroidLat((sw_lat + ne_lat) / 2)
        setCentroidLng((sw_lng + ne_lng) / 2)
      }
    }
  }

  const effectiveLevel = area?.level ?? defaultLevel ?? 1

  return (
    <form action={handleSubmit}>
      <div className="grid grid-cols-3 gap-6">
        {/* Left column: form fields */}
        <div className="col-span-2 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Grunddata</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Namn</label>
                <input
                  name="name"
                  required
                  defaultValue={area?.name ?? ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {mode === 'create' ? (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Nivå</label>
                    <select
                      name="level"
                      defaultValue={effectiveLevel}
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                    >
                      <option value={1}>Makroområde</option>
                      <option value={2}>Subområde</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Nivå</label>
                    <input
                      readOnly
                      value={area?.level === 1 ? 'Makroområde' : 'Subområde'}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500"
                    />
                    <input type="hidden" name="level" value={area?.level} />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Typ</label>
                  <select
                    name="type"
                    defaultValue={area?.type ?? 'mixed'}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {mode === 'create' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Tillhör makroområde (om subområde)
                  </label>
                  <select
                    name="parent_area_id"
                    defaultValue={defaultParentId ?? ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                  >
                    <option value="">Inget (makroområde)</option>
                    {parentOptions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Karaktär-taggar (kommaseparerade)
                </label>
                <input
                  name="character_tags"
                  defaultValue={area?.character_tags?.join(', ') ?? ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Naming priority (0-100)
                </label>
                <input
                  name="naming_priority"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={area?.naming_priority ?? 50}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Beskrivning</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Kort intro (1 mening)</label>
                <input
                  name="short_intro"
                  defaultValue={area?.short_intro ?? ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Karaktärsbeskrivning (2-4 meningar)
                </label>
                <textarea
                  name="character"
                  rows={4}
                  defaultValue={area?.character ?? ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Hero-bild</h2>
            <ImageUploader
              pathPrefix={area ? `areas/${area.id}/` : 'areas/temp/'}
              currentUrl={heroImageUrl}
              onUploaded={setHeroImageUrl}
              autoSave={area ? { table: 'curated_areas', id: area.id } : undefined}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Bbox</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">SW Latitud</label>
                <input
                  type="number"
                  step="0.0001"
                  value={bboxSwLat ?? ''}
                  onChange={e => handleBboxChange('sw_lat', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">SW Longitud</label>
                <input
                  type="number"
                  step="0.0001"
                  value={bboxSwLng ?? ''}
                  onChange={e => handleBboxChange('sw_lng', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">NE Latitud</label>
                <input
                  type="number"
                  step="0.0001"
                  value={bboxNeLat ?? ''}
                  onChange={e => handleBboxChange('ne_lat', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">NE Longitud</label>
                <input
                  type="number"
                  step="0.0001"
                  value={bboxNeLng ?? ''}
                  onChange={e => handleBboxChange('ne_lng', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: map + status */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Karta (centroid + bbox)</h2>
            <MapPicker
              lat={centroidLat}
              lng={centroidLng}
              onChange={(lat, lng) => {
                setCentroidLat(lat)
                setCentroidLng(lng)
              }}
              bbox={{
                swLat: bboxSwLat,
                swLng: bboxSwLng,
                neLat: bboxNeLat,
                neLng: bboxNeLng,
              }}
              height="280px"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Centroid lat</label>
                <input
                  type="number"
                  step="0.0001"
                  value={centroidLat ?? ''}
                  onChange={e => {
                    const v = e.target.value === '' ? null : parseFloat(e.target.value)
                    setCentroidLat(v)
                  }}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Centroid lng</label>
                <input
                  type="number"
                  step="0.0001"
                  value={centroidLng ?? ''}
                  onChange={e => {
                    const v = e.target.value === '' ? null : parseFloat(e.target.value)
                    setCentroidLng(v)
                  }}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          {mode === 'edit' && area && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Status och publicering</h2>
              <div className="mb-3">
                <StatusBadge status={area.status} />
              </div>
              {isAdmin && (
                <div className="mb-4 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={area.ready_for_app}
                      onChange={e => handleReadyForApp(e.target.checked)}
                      disabled={isPending}
                    />
                    <span>Aktiverat i appen (<code className="text-xs">ready_for_app</code>)</span>
                  </label>
                  <p className="text-xs text-gray-500">Bara admin kan ändra detta.</p>
                </div>
              )}
              <StatusFlow
                currentStatus={area.status}
                isAdmin={isAdmin}
                onTransition={handleStatusTransition}
                disabled={isPending}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
        <div>
          {mode === 'edit' && area && (
            <DeleteConfirmDialog itemName={area.name} onConfirm={handleDelete}>
              Radera område
            </DeleteConfirmDialog>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">Sparat</p>}
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary rounded-md px-4 py-2 text-sm font-medium"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
          >
            {isPending ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </div>
    </form>
  )
}
