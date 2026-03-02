"use client";

import { useState } from "react";
import type { LocalPoi } from "@/lib/types";
import PlaceDetail from "./PlaceDetail";
import LogoutButton from "./LogoutButton";

interface Props {
  pois: LocalPoi[];
  userId: string;
  onShowOnMap: (poi: LocalPoi) => void;
  onPoiUpdated: (poi: LocalPoi) => void;
}

const SYNC_DOT: Record<LocalPoi["sync_status"], string> = {
  synced: "bg-green-500",
  pending: "bg-yellow-400",
  failed: "bg-red-500",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PlacesList({ pois, userId, onShowOnMap, onPoiUpdated }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LocalPoi | null>(null);

  if (selected) {
    return (
      <PlaceDetail
        poi={selected}
        userId={userId}
        onBack={() => setSelected(null)}
        onSaved={(updated) => {
          setSelected(updated);
          onPoiUpdated(updated);
        }}
        onShowOnMap={() => {
          setSelected(null);
          onShowOnMap(selected);
        }}
      />
    );
  }

  // Newest first
  const sorted = [...pois].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  const filtered = query.trim()
    ? sorted.filter((p) =>
        p.title.toLowerCase().includes(query.trim().toLowerCase())
      )
    : sorted;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-zinc-100 px-4 pb-3 pt-4">
        <h1 className="mb-3 text-lg font-semibold text-zinc-900">
          Mina platser
        </h1>
        <div className="relative">
          <SearchIcon />
          <input
            type="search"
            placeholder="Sök platser…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState hasQuery={query.trim().length > 0} />
        ) : (
          <ul>
            {filtered.map((poi) => (
              <li key={poi.local_id}>
                <button
                  onClick={() => setSelected(poi)}
                  className="flex w-full items-center gap-3 border-b border-zinc-50 px-4 py-3 text-left active:bg-zinc-50"
                >
                  <span
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${SYNC_DOT[poi.sync_status]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {poi.title.trim() || "Namnlös plats"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatDate(poi.created_at)}
                    </p>
                  </div>
                  <ChevronRightIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 px-4 py-4">
        <LogoutButton />
      </div>
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-zinc-400">
      {hasQuery ? (
        <p className="text-sm">Inga platser matchar sökningen.</p>
      ) : (
        <>
          <p className="text-sm font-medium text-zinc-500">
            Inga platser sparade än
          </p>
          <p className="text-xs">
            Tryck ➕ på kartan för att spara din första plats.
          </p>
        </>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </span>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-zinc-300"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
