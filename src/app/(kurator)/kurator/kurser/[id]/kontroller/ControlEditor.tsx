'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { addControl, updateControl, deleteControl, reorderControls } from './actions'

interface Control {
  id: string
  course_id: string
  lat: number
  lng: number
  order_index: number
  name: string
  description: string
  hint: string
  difficulty: string
  radius_m: number
  requires_photo: boolean
  safety_note: string
  category: string
  access_type: string
  sub_course_id: string | null
  accessibility: 'terrain' | 'walkable' | 'wheelchair'
}

interface SubCourse {
  id: string
  name: string
}

interface Course {
  id: string
  name: string
  course_type: string
}

interface Props {
  course: Course
  initialControls: Control[]
  subCourses: SubCourse[]
}

const DEFAULT_CENTER: [number, number] = [18.0686, 59.3293]
const DEFAULT_ZOOM = 5
const CIRCLE_SOURCE_ID = 'control-circles'
const CIRCLE_LAYER_ID = 'control-circles-layer'

export default function ControlEditor({ course, initialControls, subCourses }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const [controls, setControls] = useState<Control[]>(initialControls)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedControl = controls.find((c) => c.id === selectedId) ?? null

  // --- Map init ---
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      map.addSource(CIRCLE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: CIRCLE_LAYER_ID,
        type: 'circle',
        source: CIRCLE_SOURCE_ID,
        paint: {
          'circle-radius': ['get', 'radiusPx'],
          'circle-color': 'var(--color-primary)',
          'circle-opacity': 0.15,
          'circle-stroke-color': 'var(--color-primary)',
          'circle-stroke-width': 1.5,
          'circle-stroke-opacity': 0.4,
        },
      })
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // --- Meters to pixels helper ---
  const metersToPixels = useCallback((lat: number, meters: number, zoom: number) => {
    const earthCircumference = 40075017
    const metersPerPixel = (earthCircumference * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom + 8)
    return meters / metersPerPixel
  }, [])

  // --- Update circle overlays ---
  const updateCircles = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const source = map.getSource(CIRCLE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    if (!source) return

    const zoom = map.getZoom()
    const features = controls.map((c) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
      properties: { radiusPx: metersToPixels(c.lat, c.radius_m, zoom) },
    }))

    source.setData({ type: 'FeatureCollection', features })
  }, [controls, metersToPixels])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    updateCircles()
    map.on('zoom', updateCircles)
    return () => { map.off('zoom', updateCircles) }
  }, [updateCircles])

  // --- Click on map → add control ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const handler = async (e: maplibregl.MapMouseEvent) => {
      const { lat, lng } = e.lngLat
      const nextIndex = controls.length
      const result = await addControl(course.id, lat, lng, nextIndex)
      if (result) {
        setControls((prev) => [...prev, result as Control])
        setSelectedId(result.id)
      }
    }

    map.on('click', handler)
    return () => { map.off('click', handler) }
  }, [controls.length, course.id])

  // --- Sync markers ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const currentIds = new Set(controls.map((c) => c.id))

    // Remove stale
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    })

    // Add/update markers
    controls.forEach((ctrl, idx) => {
      const existing = markersRef.current.get(ctrl.id)
      if (existing) {
        existing.setLngLat([ctrl.lng, ctrl.lat])
        return
      }

      const el = document.createElement('div')
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#0009AB'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
      el.style.cursor = 'grab'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.color = 'white'
      el.style.fontSize = '12px'
      el.style.fontWeight = '700'
      el.textContent = String(idx + 1)

      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([ctrl.lng, ctrl.lat])
        .addTo(map)

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedId(ctrl.id)
      })

      marker.on('dragend', async () => {
        const lngLat = marker.getLngLat()
        setControls((prev) =>
          prev.map((c) =>
            c.id === ctrl.id ? { ...c, lat: lngLat.lat, lng: lngLat.lng } : c
          )
        )
        await updateControl(ctrl.id, course.id, { lat: lngLat.lat, lng: lngLat.lng })
      })

      markersRef.current.set(ctrl.id, marker)
    })
  }, [controls, course.id])

  // --- Fit bounds on initial load ---
  useEffect(() => {
    const map = mapRef.current
    if (!map || initialControls.length === 0) return

    const bounds = new maplibregl.LngLatBounds()
    initialControls.forEach((c) => bounds.extend([c.lng, c.lat]))

    map.on('load', () => {
      map.fitBounds(bounds, { padding: 60, maxZoom: 16 })
    })

    if (map.loaded()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 16 })
    }
  }, [initialControls])

  // --- Debounced field update ---
  function handleFieldChange(field: string, value: unknown) {
    if (!selectedControl) return

    setControls((prev) =>
      prev.map((c) => (c.id === selectedControl.id ? { ...c, [field]: value } : c))
    )

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateControl(selectedControl.id, course.id, { [field]: value })
    }, 800)
  }

  // --- Delete ---
  async function handleDelete(controlId: string) {
    await deleteControl(controlId, course.id)
    setControls((prev) => prev.filter((c) => c.id !== controlId))
    if (selectedId === controlId) setSelectedId(null)
    markersRef.current.get(controlId)?.remove()
    markersRef.current.delete(controlId)
  }

  // --- Reorder ---
  async function handleMove(controlId: string, direction: -1 | 1) {
    const idx = controls.findIndex((c) => c.id === controlId)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= controls.length) return

    const reordered = [...controls]
    const [moved] = reordered.splice(idx, 1)
    reordered.splice(newIdx, 0, moved)

    const withUpdatedIndex = reordered.map((c, i) => ({ ...c, order_index: i }))
    setControls(withUpdatedIndex)
    await reorderControls(course.id, withUpdatedIndex.map((c) => c.id))
  }

  const isSequential = course.course_type === 'sequential'

  return (
    <div className="flex h-screen">
      {/* Map */}
      <div className="flex-1">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Right panel */}
      <div className="w-96 overflow-y-auto border-l border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">{course.name}</h2>
          <p className="text-sm text-gray-500">
            {controls.length} kontroller · Klicka på kartan för att lägga till
          </p>
        </div>

        {/* Control list */}
        <div className="border-b border-gray-200">
          {controls.map((ctrl, idx) => (
            <div
              key={ctrl.id}
              className={`flex items-center gap-2 border-b border-gray-100 px-4 py-2 text-sm cursor-pointer ${
                selectedId === ctrl.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedId(ctrl.id)}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {idx + 1}
              </span>
              <span className="flex-1 truncate text-gray-800">
                {ctrl.name || 'Namnlös kontroll'}
              </span>
              {ctrl.accessibility !== 'terrain' && (
                <span className="text-xs text-gray-400" title={ctrl.accessibility}>
                  {ctrl.accessibility === 'wheelchair' ? '♿' : '🚶'}
                </span>
              )}
              {isSequential && (
                <div className="flex gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMove(ctrl.id, -1) }}
                    disabled={idx === 0}
                    className="rounded px-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMove(ctrl.id, 1) }}
                    disabled={idx === controls.length - 1}
                    className="rounded px-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(ctrl.id) }}
                className="text-sm hover:underline"
                style={{ color: 'var(--color-danger)' }}
              >
                ✕
              </button>
            </div>
          ))}
          {controls.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              Klicka på kartan för att skapa din första kontroll.
            </p>
          )}
        </div>

        {/* Detail form */}
        {selectedControl && (
          <div className="space-y-3 px-4 py-4">
            <h3 className="text-sm font-semibold text-gray-700">Redigera kontroll</h3>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Namn</span>
              <input
                type="text"
                value={selectedControl.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Beskrivning</span>
              <textarea
                rows={2}
                value={selectedControl.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Ledtråd</span>
              <textarea
                rows={2}
                value={selectedControl.hint}
                onChange={(e) => handleFieldChange('hint', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Svårighet</span>
              <select
                value={selectedControl.difficulty}
                onChange={(e) => handleFieldChange('difficulty', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              >
                <option value="easy">Lätt</option>
                <option value="moderate">Medel</option>
                <option value="hard">Svår</option>
                <option value="expert">Expert</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Tillgänglighet</span>
              <select
                value={selectedControl.accessibility}
                onChange={(e) => handleFieldChange('accessibility', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              >
                <option value="terrain">Terräng</option>
                <option value="walkable">Gångvänlig</option>
                <option value="wheelchair">Rullstol</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Kategori</span>
              <select
                value={selectedControl.category ?? ''}
                onChange={(e) => handleFieldChange('category', e.target.value || null)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              >
                <option value="">Ingen</option>
                <option value="viewpoint">Utsiktspunkt</option>
                <option value="nature">Natur</option>
                <option value="cafe">Café</option>
                <option value="monument">Monument</option>
                <option value="hidden">Gömd</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Åtkomst</span>
              <select
                value={selectedControl.access_type ?? ''}
                onChange={(e) => handleFieldChange('access_type', e.target.value || null)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              >
                <option value="">Standard</option>
                <option value="car">Bil</option>
                <option value="walk">Promenad</option>
                <option value="trail">Stig</option>
                <option value="off-trail">Terräng</option>
                <option value="climb">Klättring</option>
              </select>
            </label>

            {subCourses.length > 0 && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">Delbana</span>
                <select
                  value={selectedControl.sub_course_id ?? ''}
                  onChange={(e) => handleFieldChange('sub_course_id', e.target.value || null)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                >
                  <option value="">Ingen delbana</option>
                  {subCourses.map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">
                Radie: {selectedControl.radius_m} m
              </span>
              <input
                type="range"
                min={10}
                max={50}
                value={selectedControl.radius_m}
                onChange={(e) => handleFieldChange('radius_m', Number(e.target.value))}
                className="w-full"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Säkerhetsnotering</span>
              <textarea
                rows={2}
                value={selectedControl.safety_note ?? ''}
                onChange={(e) => handleFieldChange('safety_note', e.target.value || null)}
                placeholder="T.ex. halt vid regn, brant sluttning..."
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              />
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedControl.requires_photo}
                onChange={(e) => handleFieldChange('requires_photo', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Kräver foto</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
