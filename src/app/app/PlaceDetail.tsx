"use client";

import { useState, useEffect, useRef } from "react";
import type { LocalPoi } from "@/lib/types";
import { updatePoiFields } from "@/lib/db";
import { updateServerPoi } from "@/lib/sync-pois";
import {
  uploadPoiImage,
  savePoiImageRecord,
  getPoiImageUrls,
} from "@/lib/images";

interface Props {
  poi: LocalPoi;
  userId: string;
  onBack: () => void;
  onSaved: (updated: LocalPoi) => void;
  onShowOnMap: () => void;
}

function formatCoords(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}°${latDir}, ${Math.abs(lng).toFixed(5)}°${lngDir}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SYNC_LABEL: Record<LocalPoi["sync_status"], string> = {
  synced: "Synkad",
  pending: "Väntar på sync",
  failed: "Sync misslyckades",
};

const SYNC_DOT: Record<LocalPoi["sync_status"], string> = {
  synced: "bg-green-500",
  pending: "bg-yellow-400",
  failed: "bg-red-500",
};

export default function PlaceDetail({
  poi,
  userId,
  onBack,
  onSaved,
  onShowOnMap,
}: Props) {
  const [title, setTitle] = useState(poi.title);
  const [note, setNote] = useState(poi.note ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = title !== poi.title || note !== (poi.note ?? "");

  // Load images when we have a server ID
  useEffect(() => {
    if (!poi.server_id) return;
    getPoiImageUrls(poi.server_id).then(setImageUrls).catch(() => {});
  }, [poi.server_id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updatePoiFields(poi.local_id, { title, note });
      if (poi.server_id) {
        await updateServerPoi(poi.server_id, { title, note });
      }
      onSaved({ ...poi, title, note });
    } catch {
      setError("Kunde inte spara. Försök igen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset input so same file can be picked again
    e.target.value = "";
    if (!file || !poi.server_id) return;

    setUploadingImage(true);
    setError(null);
    try {
      const path = await uploadPoiImage(file, userId, poi.server_id);
      await savePoiImageRecord(poi.server_id, userId, path);
      const urls = await getPoiImageUrls(poi.server_id);
      setImageUrls(urls);
    } catch {
      setError("Bilduppladdningen misslyckades. Försök igen.");
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-zinc-500 active:text-zinc-900"
        >
          <ChevronLeftIcon />
          Tillbaka
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-30"
        >
          {saving ? "Sparar…" : "Spara"}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <div className="border-b border-zinc-100 px-4 py-4">
          <input
            type="text"
            placeholder="Namnlös plats"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-semibold text-zinc-900 placeholder-zinc-300 outline-none"
          />
        </div>

        {/* Images */}
        <div className="border-b border-zinc-100 px-4 py-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Bilder
          </p>

          {!poi.server_id ? (
            <p className="text-sm text-zinc-400">
              Synka platsen för att lägga till bilder.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-lg object-cover"
                />
              ))}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-200 text-zinc-400 transition-colors active:border-zinc-400 disabled:opacity-50"
                aria-label="Lägg till bild"
              >
                {uploadingImage ? (
                  <SpinnerIcon />
                ) : (
                  <>
                    <CameraIcon />
                    <span className="text-[10px]">Lägg till</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImagePick}
              />
            </div>
          )}
        </div>

        {/* Note */}
        <div className="border-b border-zinc-100 px-4 py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Anteckning
          </p>
          <textarea
            placeholder="Skriv en anteckning…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="w-full resize-none text-sm text-zinc-900 placeholder-zinc-300 outline-none"
          />
        </div>

        {/* Metadata */}
        <div className="px-4 py-4 text-sm text-zinc-500">
          <p>{formatCoords(poi.lat, poi.lng)}</p>
          <p className="mt-1">{formatDate(poi.created_at)}</p>
          <p className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${SYNC_DOT[poi.sync_status]}`}
            />
            {SYNC_LABEL[poi.sync_status]}
          </p>
        </div>

        {error && (
          <p className="px-4 pb-4 text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 px-4 py-4">
        <button
          onClick={onShowOnMap}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700 active:bg-zinc-50"
        >
          Visa på karta
          <ChevronRightIcon />
        </button>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
