import { createClient } from "./supabase/client";
import type { UserPlace, PoiCategory, PoiVisibility, PoiVisitStatus } from "./types";

const BUCKET = "poi-images";

export async function getUserPlaces(): Promise<UserPlace[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_places")
    .select("*, place:places(id,name,lat,lng,category)")
    .neq("visibility", "private")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    placeId: row.place_id,
    title: row.place?.name ?? "",
    lat: row.place?.lat ?? 0,
    lng: row.place?.lng ?? 0,
    category: (row.place?.category ?? "unset") as PoiCategory,
    note: row.note ?? null,
    visibility: row.visibility as PoiVisibility,
    visitStatus: row.visit_status as PoiVisitStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function updateUserPlace(
  userPlaceId: string,
  fields: { note?: string | null; visibility?: PoiVisibility; visitStatus?: PoiVisitStatus },
  placeId: string,
  placeFields: { name?: string; category?: PoiCategory },
  userId: string
): Promise<void> {
  const supabase = createClient();

  const userPlaceUpdate: Record<string, unknown> = {};
  if (fields.note !== undefined) userPlaceUpdate.note = fields.note;
  if (fields.visibility !== undefined) userPlaceUpdate.visibility = fields.visibility;
  if (fields.visitStatus !== undefined) userPlaceUpdate.visit_status = fields.visitStatus;

  if (Object.keys(userPlaceUpdate).length > 0) {
    const { error } = await supabase
      .from("user_places")
      .update(userPlaceUpdate)
      .eq("id", userPlaceId);
    if (error) throw error;
  }

  const placeUpdate: Record<string, unknown> = {};
  if (placeFields.name !== undefined) placeUpdate.name = placeFields.name;
  if (placeFields.category !== undefined) placeUpdate.category = placeFields.category;

  if (Object.keys(placeUpdate).length > 0) {
    // Silent fail if user is not the creator
    await supabase
      .from("places")
      .update(placeUpdate)
      .eq("id", placeId)
      .eq("created_by", userId);
  }
}

export async function deleteUserPlace(userPlaceId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_places")
    .delete()
    .eq("id", userPlaceId);
  if (error) throw error;
}

export async function getUserPlaceImageUrls(userPlaceId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_place_images")
    .select("storage_path")
    .eq("user_place_id", userPlaceId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map(({ storage_path }: { storage_path: string }) => {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storage_path);
    return urlData.publicUrl;
  });
}
