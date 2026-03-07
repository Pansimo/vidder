"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import BottomNav, { type Tab } from "./BottomNav";
import { getUserPlaces } from "@/lib/user-places";
import type { UserPlace } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), { ssr: false });
const PlacesManager = dynamic(() => import("./PlacesManager"), { ssr: false });
const TripsView = dynamic(() => import("./TripsView"), { ssr: false });

interface Props {
  userId: string;
}

export default function AppShell({ userId }: Props) {
  const [tab, setTab] = useState<Tab>("map");
  const [places, setPlaces] = useState<UserPlace[]>([]);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getUserPlaces().then(setPlaces).catch(() => {});
  }, []);

  const clearFlyTarget = useCallback(() => setFlyTarget(null), []);

  function handleSelectPlace(id: string) {
    const place = places.find((p) => p.id === id);
    if (place) {
      setFlyTarget({ lat: place.lat, lng: place.lng });
    }
  }

  return (
    <div className="relative flex h-[100dvh] flex-col">
      <main className="min-h-0 flex-1 overflow-hidden">
        {tab === "map" && (
          <MapView
            places={places}
            flyTarget={flyTarget}
            onFlyComplete={clearFlyTarget}
            onSelectPlace={handleSelectPlace}
          />
        )}
        {tab === "places" && (
          <PlacesManager userId={userId} />
        )}
        {tab === "trips" && (
          <TripsView />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
