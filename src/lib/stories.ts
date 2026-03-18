import { createClient } from "./supabase/client";

interface TripStory {
  tripId: string;
  shareToken: string;
  title: string;
}

export async function getUserTripStories(): Promise<TripStory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stories")
    .select("trip_id, share_token, title")
    .eq("status", "shared")
    .not("share_token", "is", null);

  if (error || !data) return [];

  return data.map((row: { trip_id: string; share_token: string; title: string }) => ({
    tripId: row.trip_id,
    shareToken: row.share_token,
    title: row.title,
  }));
}
