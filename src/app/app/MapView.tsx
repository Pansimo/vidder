"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { UserPlace, PoiCategory } from "@/lib/types";

const POSITION_KEY = "vidder_map_position";
const DEFAULT_CENTER: [number, number] = [18.0686, 59.3293];
const DEFAULT_ZOOM = 5;

const CATEGORY_COLOR: Record<PoiCategory, string> = {
  unset: "#6b7280",
  viewpoint: "#8b5cf6",
  food: "#f59e0b",
  nature: "#10b981",
  parking: "#3b82f6",
  camp: "#f97316",
  beach: "#06b6d4",
  photo: "#ec4899",
  other: "#6b7280",
};

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
  places: UserPlace[];
  flyTarget?: FlyTarget | null;
  onFlyComplete?: () => void;
  onSelectPlace?: (id: string) => void;
}

export default function MapView({ places, flyTarget, onFlyComplete, onSelectPlace }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onSelectRef = useRef(onSelectPlace);
  onSelectRef.current = onSelectPlace;

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
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    map.on("moveend", () => {
      const c = map.getCenter();
      storePosition(c.lng, c.lat, map.getZoom());
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers when places change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(places.map((p) => p.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add missing markers
    places.forEach((place) => {
      if (markersRef.current.has(place.id)) return;
      if (!place.lat || !place.lng) return;

      const color = CATEGORY_COLOR[place.category] ?? CATEGORY_COLOR.unset;
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = color;
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
      el.style.cursor = "pointer";

      const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
        .setText(place.title || "Namnlös plats");

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([place.lng, place.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        onSelectRef.current?.(place.id);
      });

      markersRef.current.set(place.id, marker);
    });
  }, [places]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
