import { createClient } from "./supabase/client";
import { signStoragePaths } from "./storage-signing";

const BUCKET = "poi-images";

/** Upload an image file and return its storage path. */
export async function uploadPoiImage(
  file: File,
  userId: string,
  serverId: string
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${serverId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) throw error;
  return path;
}

/** Insert a poi_images record linking the upload to a POI. */
export async function savePoiImageRecord(
  poiServerId: string,
  userId: string,
  storagePath: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("poi_images").insert({
    poi_id: poiServerId,
    user_id: userId,
    storage_path: storagePath,
  });
  if (error) throw error;
}

/** Return signed URLs for all images belonging to a POI (K2: privat bucket). */
export async function getPoiImageUrls(poiServerId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("poi_images")
    .select("storage_path")
    .eq("poi_id", poiServerId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const paths = data.map(({ storage_path }: { storage_path: string }) => storage_path);
  const urls = await signStoragePaths(supabase, BUCKET, paths);
  return urls.filter((u): u is string => u !== null);
}
