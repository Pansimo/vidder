"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import BottomNav from "./BottomNav";
import PlacesList from "./PlacesList";
import { getAllPois, putPoi, updatePoiSync } from "@/lib/db";
import { migrateFromLocalStorage } from "@/lib/migrate";
import { syncPoi, syncPending, fetchAndMerge } from "@/lib/sync-pois";
import type { LocalPoi } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

type Tab = "map" | "places";

interface FlyTarget {
  lat: number;
  lng: number;
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      maximumAge: 5000,
      enableHighAccuracy: true,
    })
  );
}

interface Props {
  userId: string;
}

export default function AppShell({ userId }: Props) {
  const [tab, setTab] = useState<Tab>("map");
  const [pois, setPois] = useState<LocalPoi[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);

  // Mount: migrate legacy data, load local, then background-sync
  useEffect(() => {
    (async () => {
      await migrateFromLocalStorage();

      const local = await getAllPois();
      setPois(local);

      try {
        const afterSync = await syncPending(userId);
        setPois(afterSync);
      } catch {}
      try {
        const merged = await fetchAndMerge(userId);
        setPois(merged);
      } catch {}
    })();
  }, [userId]);

  // Auto-sync when connection is restored
  useEffect(() => {
    async function handleOnline() {
      try {
        const afterSync = await syncPending(userId);
        setPois(afterSync);
      } catch {}
      try {
        const merged = await fetchAndMerge(userId);
        setPois(merged);
      } catch {}
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [userId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const clearFlyTarget = useCallback(() => setFlyTarget(null), []);

  function handleShowOnMap(poi: LocalPoi) {
    setFlyTarget({ lat: poi.lat, lng: poi.lng });
    setTab("map");
  }

  function handlePoiUpdated(updated: LocalPoi) {
    setPois((current) =>
      current.map((p) => (p.local_id === updated.local_id ? updated : p))
    );
  }

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const pos = await getPosition();
      const poi: LocalPoi = {
        local_id: crypto.randomUUID(),
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        title: "",
        created_at: new Date().toISOString(),
        sync_status: "pending",
      };

      // Write to IndexedDB first — marker appears immediately
      await putPoi(poi);
      setPois(await getAllPois());
      setTab("map");
      showToast("Plats sparad");

      // Sync to server (non-blocking from user perspective)
      const synced = await syncPoi(poi, userId);
      if (synced.sync_status === "synced" && synced.server_id) {
        await updatePoiSync(poi.local_id, synced.server_id);
        setPois(await getAllPois());
      }
    } catch {
      showToast("Kunde inte hämta position");
    } finally {
      setSaving(false);
    }
  }, [saving, userId]);

  return (
    <div className="relative flex h-[100dvh] flex-col">
      <main className="min-h-0 flex-1 overflow-hidden">
        {tab === "map" && (
          <MapView
            pois={pois}
            flyTarget={flyTarget}
            onFlyComplete={clearFlyTarget}
          />
        )}
        {tab === "places" && (
          <PlacesList
            pois={pois}
            userId={userId}
            onShowOnMap={handleShowOnMap}
            onPoiUpdated={handlePoiUpdated}
          />
        )}
      </main>

      {toast && (
        <div className="pointer-events-none absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <BottomNav
        active={tab}
        onChange={setTab}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
