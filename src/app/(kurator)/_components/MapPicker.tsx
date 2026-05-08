'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'

interface Props {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  bbox?: {
    swLat: number | null
    swLng: number | null
    neLat: number | null
    neLng: number | null
  }
  height?: string
  zoom?: number
}

const DEFAULT_CENTER: [number, number] = [18.07, 59.33]
const DEFAULT_ZOOM = 5
const MARKER_COLOR = '#0009AB'

export default function MapPicker({ lat, lng, onChange, bbox, height = '400px', zoom }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const updateMarker = useCallback((map: maplibregl.Map, newLat: number, newLng: number) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([newLng, newLat])
    } else {
      const el = document.createElement('div')
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = MARKER_COLOR
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
      el.style.cursor = 'grab'

      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([newLng, newLat])
        .addTo(map)

      marker.on('dragend', () => {
        const ll = marker.getLngLat()
        onChangeRef.current(ll.lat, ll.lng)
      })

      markerRef.current = marker
    }
  }, [])

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center: [number, number] = lat != null && lng != null
      ? [lng, lat]
      : DEFAULT_CENTER

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center,
      zoom: zoom ?? (lat != null ? 10 : DEFAULT_ZOOM),
    })

    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.lngLat
      updateMarker(map, clickLat, clickLng)
      onChangeRef.current(clickLat, clickLng)
    })

    if (lat != null && lng != null) {
      map.on('load', () => updateMarker(map, lat, lng))
    }

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync marker position when lat/lng props change externally
  useEffect(() => {
    const map = mapRef.current
    if (!map || lat == null || lng == null) return
    updateMarker(map, lat, lng)
  }, [lat, lng, updateMarker])

  // Draw bbox rectangle
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const sourceId = 'bbox-source'
    const layerId = 'bbox-layer'

    function drawBbox() {
      if (!bbox || bbox.swLat == null || bbox.swLng == null || bbox.neLat == null || bbox.neLng == null) {
        if (map!.getLayer(layerId)) map!.removeLayer(layerId)
        if (map!.getSource(sourceId)) map!.removeSource(sourceId)
        return
      }

      const coords = [
        [bbox.swLng, bbox.swLat],
        [bbox.neLng, bbox.swLat],
        [bbox.neLng, bbox.neLat],
        [bbox.swLng, bbox.neLat],
        [bbox.swLng, bbox.swLat],
      ]

      const geojson = {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [coords] },
        properties: {},
      }

      const source = map!.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
      if (source) {
        source.setData(geojson as GeoJSON.Feature)
      } else {
        map!.addSource(sourceId, { type: 'geojson', data: geojson as GeoJSON.Feature })
        map!.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': MARKER_COLOR,
            'line-width': 2,
            'line-dasharray': [3, 2],
          },
        })
      }
    }

    if (map.loaded()) {
      drawBbox()
    } else {
      map.on('load', drawBbox)
    }

    return () => {
      map.off('load', drawBbox)
    }
  }, [bbox?.swLat, bbox?.swLng, bbox?.neLat, bbox?.neLng]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="rounded-md border border-gray-200"
      style={{ height, width: '100%' }}
    />
  )
}
