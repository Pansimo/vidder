"use client";

import { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { getUserTrips, getTripPoints } from "@/lib/trips";
import { getUserTripStories } from "@/lib/stories";
import type { Trip } from "@/lib/types";

interface TripStory {
  tripId: string;
  shareToken: string;
  title: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDist(meters: number) {
  if (meters >= 1000) return (meters / 1000).toFixed(1) + " km";
  return Math.round(meters) + " m";
}

function sourceEmoji(source: string | null): string {
  switch (source) {
    case "live": return "🚗";
    case "imported": return "📸";
    case "manual": return "✏️";
    default: return "🗺️";
  }
}

// ---- Trip map ----

function TripMap({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [15, 62],
      zoom: 5,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", async () => {
      const points = await getTripPoints(tripId);
      if (!points.length) return;

      const coords = points.map((p) => [p.lng, p.lat] as [number, number]);

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

      // Fit bounds
      const bounds = coords.reduce(
        (b, c) => b.extend(c as maplibregl.LngLatLike),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 600 });

      // Start marker
      new maplibregl.Marker({ color: "#3b82f6" })
        .setLngLat(coords[0])
        .addTo(map);
      // End marker
      new maplibregl.Marker({ color: "#ef4444" })
        .setLngLat(coords[coords.length - 1])
        .addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [tripId]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-4 py-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeftIcon />
          Tillbaka
        </button>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  );
}

// ---- Main ----

export default function TripsView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stories, setStories] = useState<TripStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getUserTrips(), getUserTripStories()])
      .then(([t, s]) => {
        setTrips(t);
        setStories(s);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {selectedTripId && (
        <TripMap tripId={selectedTripId} onClose={() => setSelectedTripId(null)} />
      )}

      {/* Header */}
      <div className="shrink-0 border-b border-zinc-100 px-4 pb-3 pt-4">
        <h1 className="text-lg font-semibold text-zinc-900">Mina resor</h1>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-sm text-zinc-400">Laddar…</div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-zinc-400">
            <p className="text-sm font-medium text-zinc-500">Inga resor än</p>
            <p className="text-xs">Starta en resa i appen för att spåra din rutt.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-50">
            {trips.map((trip) => {
              const story = stories.find((s) => s.tripId === trip.id);
              return (
                <li key={trip.id}>
                  <button
                    onClick={() => setSelectedTripId(trip.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-zinc-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg">
                      {sourceEmoji(trip.source)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {trip.name || "Namnlös resa"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatDate(trip.startedAt)}
                        {trip.distanceMeters > 0 && ` · ${formatDist(trip.distanceMeters)}`}
                      </p>
                    </div>
                    {trip.isLive && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Live
                      </span>
                    )}
                    {story && (
                      <a
                        href={`/story/${story.shareToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: '#0009AB' }}
                      >
                        📖 Story
                      </a>
                    )}
                    {!story && trip.shareToken && (
                      <a
                        href={`/resa/${trip.shareToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
                      >
                        Dela
                      </a>
                    )}
                    <ChevronRightIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-300">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7H5.5a3.5 3.5 0 0 1 0-7H14" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}
