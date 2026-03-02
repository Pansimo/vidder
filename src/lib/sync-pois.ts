import { createClient } from "./supabase/client";
import { getAllPois, getPendingPois, putPoi, updatePoiSync } from "./db";
import type { LocalPoi } from "./types";

/** Push a single POI to Supabase. Returns the updated LocalPoi. */
export async function syncPoi(
  poi: LocalPoi,
  userId: string
): Promise<LocalPoi> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pois")
    .insert({
      user_id: userId,
      title: poi.title,
      note: poi.note ?? null,
      lat: poi.lat,
      lng: poi.lng,
      created_at: poi.created_at,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ...poi, sync_status: "failed" };
  }
  return { ...poi, server_id: data.id as string, sync_status: "synced" };
}

/**
 * Push all pending POIs to Supabase.
 * Updates IndexedDB records and returns the full updated list.
 */
export async function syncPending(userId: string): Promise<LocalPoi[]> {
  const pending = await getPendingPois();
  if (pending.length === 0) return getAllPois();

  const supabase = createClient();

  const results = await Promise.allSettled(
    pending.map((poi) =>
      supabase
        .from("pois")
        .insert({
          user_id: userId,
          title: poi.title,
          note: poi.note ?? null,
          lat: poi.lat,
          lng: poi.lng,
          created_at: poi.created_at,
        })
        .select("id")
        .single()
        .then(({ data, error }) => {
          if (error || !data) throw new Error("sync failed");
          return { local_id: poi.local_id, server_id: data.id as string };
        })
    )
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      await updatePoiSync(result.value.local_id, result.value.server_id);
    }
  }

  return getAllPois();
}

/**
 * Fetch all user POIs from Supabase and add any that are missing locally.
 * Returns the full merged list.
 */
export async function fetchAndMerge(userId: string): Promise<LocalPoi[]> {
  const supabase = createClient();
  const { data: serverPois, error } = await supabase
    .from("pois")
    .select("id, lat, lng, title, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !serverPois) throw error ?? new Error("fetch failed");

  const local = await getAllPois();
  const knownServerIds = new Set(local.map((p) => p.server_id).filter(Boolean));

  const newFromServer: LocalPoi[] = serverPois
    .filter((sp: { id: string }) => !knownServerIds.has(sp.id))
    .map(
      (sp: {
        id: string;
        lat: number;
        lng: number;
        title: string;
        note: string | null;
        created_at: string;
      }) => ({
        local_id: crypto.randomUUID(),
        server_id: sp.id,
        lat: sp.lat,
        lng: sp.lng,
        title: sp.title ?? "",
        note: sp.note ?? "",
        created_at: sp.created_at,
        sync_status: "synced" as const,
      })
    );

  for (const poi of newFromServer) {
    await putPoi(poi);
  }

  return getAllPois();
}

/** Update title and/or note on an existing Supabase row. */
export async function updateServerPoi(
  serverId: string,
  fields: { title?: string; note?: string }
): Promise<void> {
  const supabase = createClient();
  await supabase.from("pois").update(fields).eq("id", serverId);
}
