"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { UserPlace } from "@/lib/types";

const POSITION_KEY = "vidder_manager_map_position";
const DEFAULT_CENTER: [number, number] = [18.0686, 59.3293];
const DEFAULT_ZOOM = 5;

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
  selectedId: string | null;
  flyTarget?: FlyTarget | null;
  onSelectPlace: (id: string) => void;
}

export default function PlacesManagerMap({
  places,
  selectedId,
  flyTarget,
  onSelectPlace,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onSelectRef = useRef(onSelectPlace);
  onSelectRef.current = onSelectPlace;

  // Fly to target
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTarget.lng, flyTarget.lat],
      zoom: 14,
      duration: 800,
    });
  }, [flyTarget]);

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

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers when places or selectedId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove all existing markers first (needed to update color on selection change)
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    places.forEach((place) => {
      const isSelected = place.id === selectedId;
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = isSelected ? "#dc2626" : "#2563eb";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4)";
      el.style.cursor = "pointer";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      el.addEventListener("click", () => onSelectRef.current(place.id));
      markersRef.current.set(place.id, marker);
    });
  }, [places, selectedId]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
