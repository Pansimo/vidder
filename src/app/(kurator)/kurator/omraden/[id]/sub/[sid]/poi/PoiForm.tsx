'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import MapPicker from '../../../../../../_components/MapPicker'
import ImageUploader from '../../../../../../_components/ImageUploader'
import StatusBadge from '../../../../../../_components/StatusBadge'
import StatusFlow from '../../../../../../_components/StatusFlow'
import DeleteConfirmDialog from '../../../../../../_components/DeleteConfirmDialog'
import { createPoi, updatePoi, deletePoi, transitionPoiStatus } from './actions'

const CATEGORIES = [
  'natur', 'nationalpark', 'utsikt', 'kust',
  'kultur', 'historia', 'arkitektur', 'urban_overlay',
]

const SEASONALITIES = [
  { value: 'year_round', label: 'Året runt' },
  { value: 'summer', label: 'Sommar' },
  { value: 'winter', label: 'Vinter' },
  { value: 'spring', label: 'Vår' },
  { value: 'autumn', label: 'Höst' },
]

interface Poi {
  id: string
  name: string
  area_id: string
  category: string
  lat: number
  lng: number
  character_tags: string[]
  short_description: string | null
  description: string | null
  hero_image_url: string | null
  external_url: string | null
  seasonality: string
  accessibility_note: string | null
  is_featured: boolean
  display_priority: number
  status: 'draft' | 'review' | 'published' | 'archived'
}

interface Props {
  poi?: Poi
  mode: 'create' | 'edit'
  macroId: string
  subId: string
  isAdmin: boolean
  defaultLat?: number | null
  defaultLng?: number | null
  defaultZoom?: number
}

export default function PoiForm({
  poi, mode, macroId, subId, isAdmin,
  defaultLat, defaultLng, defaultZoom,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [lat, setLat] = useState<number | null>(poi?.lat ?? defaultLat ?? null)
  const [lng, setLng] = useState<number | null>(poi?.lng ?? defaultLng ?? null)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(poi?.hero_image_url ?? null)
  const [isFeatured, setIsFeatured] = useState(poi?.is_featured ?? false)

  function handleSubmit(formData: FormData) {
    formData.set('lat', lat?.toString() ?? '')
    formData.set('lng', lng?.toString() ?? '')
    formData.set('hero_image_url', heroImageUrl ?? '')
    formData.set('is_featured', isFeatured ? 'true' : 'false')

    startTransition(async () => {
      setError(null)
      setSaved(false)

      const result = mode === 'create'
        ? await createPoi(macroId, subId, formData)
        : await updatePoi(poi!.id, macroId, subId, formData)

      if (result && 'error' in result && typeof result.error === 'string') {
        setError(result.error)
      } else if (mode === 'edit') {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  function handleStatusTransition(newStatus: 'draft' | 'review' | 'published' | 'archived') {
    if (!poi) return
    startTransition(async () => {
      setError(null)
      const result = await transitionPoiStatus(poi.id, macroId, subId, newStatus)
      if (result && 'error' in result && typeof result.error === 'string') setError(result.error)
      else router.refresh()
    })
  }

  function handleDelete() {
    if (!poi) return
    startTransition(async () => {
      setError(null)
      const result = await deletePoi(poi.id, macroId, subId)
      if (result && 'error' in result && typeof result.error === 'string') {
        setError(result.error)
      } else {
        router.push(`/kurator/omraden/${macroId}/sub/${subId}/poi`)
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <div className="grid grid-cols-5 gap-6">
        {/* Left column: form fields */}
        <div className="col-span-3 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Grunddata</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Namn</label>
                <input
                  name="name"
                  required
                  defaultValue={poi?.name ?? ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Kategori</label>
                  <select
                    name="category"
                    required
                    defaultValue={poi?.category ?? 'natur'}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Säsong</label>
                  <select
                    name="seasonality"
                    defaultValue={poi?.seasonality ?? 'year_round'}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                  >
                    {SEASONALITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Karaktär-taggar (kommaseparerade)
                </label>
                <input
                  name="character_tags"
                  defaultValue={poi?.character_tags?.join(', ') ?? ''}
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
                <label className="mb-1 block text-xs font-medium text-gray-700">Kort (1 mening, list-card)</label>
                <input
                  name="short_description"
                  defaultValue={poi?.short_description ?? ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Lång (2-4 meningar, detaljvy)</label>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={poi?.description ?? ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Tillgänglighetsnotering</label>
                <input
                  name="accessibility_note"
                  defaultValue={poi?.accessibility_note ?? ''}
                  placeholder="t.ex. 10 min vandring från p-plats"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Extern URL (valfri)</label>
                <input
                  name="external_url"
                  type="url"
                  defaultValue={poi?.external_url ?? ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Hero-bild</h2>
            <ImageUploader
              pathPrefix={poi ? `pois/${poi.id}/` : 'pois/temp/'}
              currentUrl={heroImageUrl}
              onUploaded={setHeroImageUrl}
            />
          </div>
        </div>

        {/* Right column: map + display + status */}
        <div className="col-span-2 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Plats (klicka eller dra markör)</h2>
            <MapPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng) }}
              height="320px"
              zoom={defaultZoom}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Latitud</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat ?? ''}
                  onChange={e => setLat(e.target.value === '' ? null : parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Longitud</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng ?? ''}
                  onChange={e => setLng(e.target.value === '' ? null : parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Display</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={e => setIsFeatured(e.target.checked)}
                />
                <span>Featured (visas i höjdpunkter)</span>
              </label>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Display priority (0-100)</label>
                <input
                  name="display_priority"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={poi?.display_priority ?? 50}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          {mode === 'edit' && poi && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Status</h2>
              <div className="mb-3">
                <StatusBadge status={poi.status} />
              </div>
              <StatusFlow
                currentStatus={poi.status}
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
          {mode === 'edit' && poi && (
            <DeleteConfirmDialog itemName={poi.name} onConfirm={handleDelete}>
              Radera POI
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
