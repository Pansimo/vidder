"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  getUserPlaces,
  updateUserPlace,
  deleteUserPlace,
  getUserPlaceImageUrls,
} from "@/lib/user-places";
import type { UserPlace, PoiCategory, PoiVisibility, PoiVisitStatus } from "@/lib/types";

const PlacesManagerMap = dynamic(() => import("./PlacesManagerMap"), { ssr: false });

const CATEGORY_LABELS: Record<PoiCategory, string> = {
  unset: "❓",
  viewpoint: "🏔 Utsikt",
  food: "🍽 Mat",
  nature: "🌿 Natur",
  parking: "🅿 Parkering",
  camp: "⛺ Camp",
  beach: "🏖 Strand",
  photo: "📷 Foto",
  other: "📌 Annat",
};

const CATEGORY_OPTIONS: PoiCategory[] = [
  "unset","viewpoint","food","nature","parking","camp","beach","photo","other",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---- Sub-components ----

function PlacesManagerList({
  places,
  selectedId,
  onSelect,
}: {
  places: UserPlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (places.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-400">
        Inga platser hittades
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {places.map((p) => (
        <li key={p.id}>
          <button
            onClick={() => onSelect(p.id)}
            className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors ${
              p.id === selectedId ? "bg-blue-50" : "hover:bg-zinc-50"
            }`}
          >
            <span className="truncate text-sm font-medium text-zinc-900">
              {CATEGORY_LABELS[p.category]} {p.title || "(namnlös)"}
            </span>
            <span className="text-xs text-zinc-400">{formatDate(p.createdAt)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function PlacesManagerEditor({
  place,
  onBack,
  onSaved,
  onDeleted,
  onShowOnMap,
  userId,
}: {
  place: UserPlace;
  onBack: () => void;
  onSaved: (updated: UserPlace) => void;
  onDeleted: (id: string) => void;
  onShowOnMap: (place: UserPlace) => void;
  userId: string;
}) {
  const [title, setTitle] = useState(place.title);
  const [category, setCategory] = useState<PoiCategory>(place.category);
  const [visibility, setVisibility] = useState<PoiVisibility>(place.visibility);
  const [visitStatus, setVisitStatus] = useState<PoiVisitStatus>(place.visitStatus);
  const [note, setNote] = useState(place.note ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Reset fields when place changes
  useEffect(() => {
    setTitle(place.title);
    setCategory(place.category);
    setVisibility(place.visibility);
    setVisitStatus(place.visitStatus);
    setNote(place.note ?? "");
    setConfirmDelete(false);
    setImageUrls([]);
    getUserPlaceImageUrls(place.id).then(setImageUrls).catch(() => {});
  }, [place.id]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await updateUserPlace(
        place.id,
        { note: note || null, visibility, visitStatus, title, category },
        place.placeId,
        userId
      );
      onSaved({
        ...place,
        title,
        category,
        visibility,
        visitStatus,
        note: note || null,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteUserPlace(place.id);
      onDeleted(place.id);
    } catch (err) {
      console.error("Delete failed", err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeftIcon /> Tillbaka
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Sparar…" : "Spara"}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Category chips */}
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-500">Kategori</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  category === cat
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-500">Synlighet</label>
          <div className="flex gap-2">
            {(["private", "shared", "public"] as PoiVisibility[]).map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  visibility === v
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {v === "private" ? "Privat" : v === "shared" ? "Delad" : "Publik"}
              </button>
            ))}
          </div>
        </div>

        {/* Visit status */}
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-500">Status</label>
          <div className="flex gap-2">
            {(["visited", "planned"] as PoiVisitStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setVisitStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  visitStatus === s
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {s === "visited" ? "Besökt" : "Planerad"}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Anteckning</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Images (read-only) */}
        {imageUrls.length > 0 && (
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-500">Bilder</label>
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 px-4 py-3">
        <button
          onClick={() => onShowOnMap(place)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Visa på karta
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            confirmDelete
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          {deleting ? "Tar bort…" : confirmDelete ? "Bekräfta" : "Ta bort"}
        </button>
      </div>
    </div>
  );
}

// ---- Main component ----

interface Props {
  userId: string;
}

export default function PlacesManager({ userId }: Props) {
  const [places, setPlaces] = useState<UserPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PoiCategory | "">("");
  const [visibilityFilter, setVisibilityFilter] = useState<PoiVisibility | "">("");
  const [visitFilter, setVisitFilter] = useState<PoiVisitStatus | "">("");
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getUserPlaces()
      .then(setPlaces)
      .catch(() => setError("Kunde inte ladda platser"))
      .finally(() => setLoading(false));
  }, []);

  const filteredPlaces = useMemo(() => {
    const q = query.toLowerCase();
    return places.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q) && !(p.note ?? "").toLowerCase().includes(q))
        return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (visibilityFilter && p.visibility !== visibilityFilter) return false;
      if (visitFilter && p.visitStatus !== visitFilter) return false;
      return true;
    });
  }, [places, query, categoryFilter, visibilityFilter, visitFilter]);

  const selected = places.find((p) => p.id === selectedId) ?? null;

  const handleSelectPlace = useCallback((id: string) => {
    const place = places.find((p) => p.id === id);
    if (place) setFlyTarget({ lat: place.lat, lng: place.lng });
    setSelectedId(id);
  }, [places]);

  function handleSaved(updated: UserPlace) {
    setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleDeleted(id: string) {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    setSelectedId(null);
  }

  function handleShowOnMap(place: UserPlace) {
    setFlyTarget({ lat: place.lat, lng: place.lng });
    setSelectedId(null);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      {/* Map */}
      <div className="h-[45dvh] shrink-0 md:h-full md:flex-1">
        <PlacesManagerMap
          places={filteredPlaces}
          selectedId={selectedId}
          flyTarget={flyTarget}
          onSelectPlace={handleSelectPlace}
        />
      </div>

      {/* Right panel */}
      <div className="relative flex flex-col overflow-hidden border-t border-zinc-200 md:w-96 md:border-l md:border-t-0">
        {/* Toolbar */}
        <div className="shrink-0 space-y-2 border-b border-zinc-100 p-3">
          <input
            type="search"
            placeholder="Sök platser…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as PoiCategory | "")}
              className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs outline-none"
            >
              <option value="">Alla kategorier</option>
              {CATEGORY_OPTIONS.filter((c) => c !== "unset").map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as PoiVisibility | "")}
              className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs outline-none"
            >
              <option value="">Alla synligheter</option>
              <option value="private">Privat</option>
              <option value="shared">Delad</option>
              <option value="public">Publik</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className={`flex-1 overflow-y-auto ${selected ? "hidden md:block" : ""}`}>
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-zinc-400">
              Laddar…
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-500">{error}</div>
          ) : (
            <PlacesManagerList
              places={filteredPlaces}
              selectedId={selectedId}
              onSelect={handleSelectPlace}
            />
          )}
        </div>

        {/* Editor overlay */}
        {selected && (
          <PlacesManagerEditor
            place={selected}
            onBack={() => setSelectedId(null)}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onShowOnMap={handleShowOnMap}
            userId={userId}
          />
        )}
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
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
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
