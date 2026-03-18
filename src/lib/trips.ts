import { createClient } from "./supabase/client";
import type { Trip, TripPoint } from "./types";

export async function getUserTrips(): Promise<Trip[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, name, started_at, ended_at, distance_meters, is_live, share_token, source")
    .order("started_at", { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    name: row.name ?? "",
    startedAt: row.started_at,
    endedAt: row.ended_at ?? null,
    distanceMeters: row.distance_meters ?? 0,
    isLive: row.is_live ?? false,
    shareToken: row.share_token ?? null,
    source: row.source ?? null,
  }));
}

export async function getTripPoints(tripId: string): Promise<TripPoint[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_points")
    .select("lat, lng, recorded_at")
    .eq("trip_id", tripId)
    .order("recorded_at", { ascending: true });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    lat: row.lat,
    lng: row.lng,
    recordedAt: row.recorded_at,
  }));
}

export async function getTripByShareToken(
  shareToken: string
): Promise<(Trip & { userId: string }) | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, user_id, name, started_at, ended_at, distance_meters, is_live, share_token, source")
    .eq("share_token", shareToken)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name ?? "",
    startedAt: data.started_at,
    endedAt: data.ended_at ?? null,
    distanceMeters: data.distance_meters ?? 0,
    isLive: data.is_live ?? false,
    shareToken: data.share_token ?? null,
    source: data.source ?? null,
  };
}
