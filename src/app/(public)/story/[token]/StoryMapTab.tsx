'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { PlaceCardData } from '@/lib/types';

interface StoryMapTabProps {
  routePoints: Array<{ lat: number; lng: number }>;
  places: PlaceCardData[];
}

export default function StoryMapTab({ routePoints, places }: StoryMapTabProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}`,
      center: [0, 0],
      zoom: 1,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Route line
      if (routePoints.length > 1) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routePoints.map((p) => [p.lng, p.lat]),
            },
          },
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#22C55E',
            'line-width': 3,
            'line-opacity': 0.8,
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
        });
      }

      // Place markers
      places.forEach((place) => {
        const el = document.createElement('div');
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#0009AB';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';

        new maplibregl.Marker({ element: el })
          .setLngLat([place.lng, place.lat])
          .setPopup(new maplibregl.Popup({ offset: 8 }).setText(place.title))
          .addTo(map);
      });

      // Fit bounds
      const allPoints = [
        ...routePoints.map((p) => [p.lng, p.lat] as [number, number]),
        ...places.map((p) => [p.lng, p.lat] as [number, number]),
      ];
      if (allPoints.length > 0) {
        const bounds = new maplibregl.LngLatBounds(allPoints[0], allPoints[0]);
        allPoints.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [routePoints, places]);

  return <div ref={mapContainer} className="h-full w-full" />;
}
