"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { createClient } from "@/lib/supabase/client";
import type { Trip } from "@/lib/types";

interface LivePos {
  lat: number;
  lng: number;
  speed: number | null;
  updated_at: string;
}

function fmtDist(m: number) {
  if (m >= 1000) return (m / 1000).toFixed(1) + " km";
  return Math.round(m) + " m";
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Props {
  trip: Trip;
}

export default function TripShareClient({ trip }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const liveMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [livePos, setLivePos] = useState<LivePos | null>(null);
  const [status, setStatus] = useState(trip.isLive ? "Ansluter…" : "");

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [15, 62],
      zoom: 5,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    const supabase = createClient();

    map.on("load", async () => {
      // Load route
      const { data: points } = await supabase
        .from("trip_points")
        .select("lat, lng")
        .eq("trip_id", trip.id)
        .order("recorded_at", { ascending: true });

      const coords: [number, number][] = (points ?? []).map((p: { lat: number; lng: number }) => [p.lng, p.lat]);

      if (coords.length > 0) {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: coords },
            properties: {},
          },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: { "line-color": "#10b981", "line-width": 3, "line-opacity": 0.9 },
        });

        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
      }

      if (trip.isLive) {
        // Load current live position
        const { data: pos } = await supabase
          .from("live_positions")
          .select("lat, lng, speed, updated_at")
          .eq("trip_id", trip.id)
          .maybeSingle();

        if (pos) {
          setLivePos(pos);
          updateLiveMarker(map, pos);
          setStatus("");
        } else {
          setStatus("Väntar på position…");
        }

        // Subscribe to realtime updates
        supabase
          .channel(`share-live-${trip.id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "live_positions", filter: `trip_id=eq.${trip.id}` },
            (payload) => {
              const newPos = payload.new as LivePos;
              setLivePos(newPos);
              setStatus("");
              updateLiveMarker(map, newPos);
            }
          )
          .subscribe();

        // Subscribe to new route points
        supabase
          .channel(`share-points-${trip.id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "trip_points", filter: `trip_id=eq.${trip.id}` },
            (payload) => {
              const { lat, lng } = payload.new as { lat: number; lng: number };
              const src = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
              if (src) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const existing = (src as any)._data as GeoJSON.Feature<GeoJSON.LineString>;
                existing.geometry.coordinates.push([lng, lat]);
                src.setData(existing);
              }
            }
          )
          .subscribe();
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateLiveMarker(map: maplibregl.Map, pos: LivePos) {
    if (liveMarkerRef.current) {
      liveMarkerRef.current.setLngLat([pos.lng, pos.lat]);
      map.panTo([pos.lng, pos.lat], { duration: 800 });
    } else {
      const el = document.createElement("div");
      el.style.cssText =
        "width:18px;height:18px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 0 0 5px rgba(16,185,129,0.25)";
      liveMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([pos.lng, pos.lat])
        .addTo(map);
      map.flyTo({ center: [pos.lng, pos.lat], zoom: 14 });
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Nav */}
      <nav className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
        <a href="/" className="font-bold text-zinc-900" style={{ fontFamily: "system-ui, sans-serif", fontSize: 20, letterSpacing: -1 }}>
          Vidder
        </a>
        {trip.isLive && (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        )}
        <span className="flex-1 truncate text-sm text-zinc-500">
          {trip.name || "Namnlös resa"}
        </span>
      </nav>

      {/* Map */}
      <div ref={containerRef} className="flex-1" />

      {/* Info bar */}
      {(trip.distanceMeters > 0 || livePos) && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-6 rounded-2xl border border-zinc-200 bg-white/90 px-5 py-3 shadow-md backdrop-blur">
          {trip.distanceMeters > 0 && (
            <Stat label="Distans" value={fmtDist(trip.distanceMeters)} />
          )}
          {livePos?.speed != null && (
            <Stat label="Fart" value={`${(livePos.speed * 3.6).toFixed(0)} km/h`} />
          )}
          {livePos?.updated_at && (
            <Stat label="Uppdaterad" value={fmtTime(livePos.updated_at)} />
          )}
        </div>
      )}

      {/* Status overlay */}
      {status && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white/90 px-4 py-2 text-sm text-zinc-500 shadow backdrop-blur">
          {status}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-base font-bold text-zinc-900">{value}</div>
      <div className="text-[11px] text-zinc-400">{label}</div>
    </div>
  );
}
