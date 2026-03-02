"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { LocalPoi } from "@/lib/types";

const POSITION_KEY = "vidder_map_position";
const DEFAULT_CENTER: [number, number] = [18.0686, 59.3293]; // Stockholm
const DEFAULT_ZOOM = 12;

interface StoredPosition {
  lng: number;
  lat: number;
  zoom: number;
}

function loadPosition(): StoredPosition | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    return raw ? (JSON.parse(raw) as StoredPosition) : null;
  } catch {
    return null;
  }
}

function storePosition(lng: number, lat: number, zoom: number) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ lng, lat, zoom }));
  } catch {}
}

interface FlyTarget {
  lat: number;
  lng: number;
}

interface Props {
  pois: LocalPoi[];
  flyTarget?: FlyTarget | null;
  onFlyComplete?: () => void;
}

export default function MapView({ pois, flyTarget, onFlyComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // Fly to a specific location when requested
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTarget.lng, flyTarget.lat],
      zoom: 15,
      duration: 800,
    });
    onFlyComplete?.();
  }, [flyTarget, onFlyComplete]);

  // Map init
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const saved = loadPosition();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: saved ? [saved.lng, saved.lat] : DEFAULT_CENTER,
      zoom: saved ? saved.zoom : DEFAULT_ZOOM,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("moveend", () => {
      const c = map.getCenter();
      storePosition(c.lng, c.lat, map.getZoom());
    });

    if (!saved) {
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          map.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom: 14,
          });
        },
        null,
        { timeout: 8000, maximumAge: 60_000 }
      );
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers whenever pois change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Add missing markers
    pois.forEach((poi) => {
      if (!markersRef.current.has(poi.local_id)) {
        const marker = new maplibregl.Marker({ color: "#18181b" })
          .setLngLat([poi.lng, poi.lat])
          .addTo(map);
        markersRef.current.set(poi.local_id, marker);
      }
    });

    // Remove stale markers
    const ids = new Set(pois.map((p) => p.local_id));
    markersRef.current.forEach((marker, id) => {
      if (!ids.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [pois]);

  function flyToUserLocation() {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 15,
          duration: 800,
        });
      },
      null,
      { timeout: 8000 }
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <button
        onClick={flyToUserLocation}
        className="absolute bottom-4 right-4 z-10 rounded-full bg-white p-3 shadow-md active:bg-zinc-100"
        aria-label="Min position"
      >
        <LocateIcon />
      </button>
    </div>
  );
}

function LocateIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
