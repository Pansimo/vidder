import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * K2 (v126, Ulf-beslut 8): de privata bucketarna (avatars, poi-images,
 * story-photos, story-recordings, track-photos, recordings) läses bara via
 * signerade URL:er. Signeringen går under användarens session — serverns
 * läsregel (can_read_storage_object) avgör. Nekat eller saknat objekt ger
 * null (servern skiljer inte på dem).
 */
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

/** Signerar sökvägar i en bucket i ETT anrop. Samma ordning som `paths`. */
export async function signStoragePaths(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[],
): Promise<(string | null)[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return paths.map(() => null);
  const byPath = new Map<string, string>();
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) byPath.set(item.path, item.signedUrl);
  }
  return paths.map((p) => byPath.get(p) ?? null);
}
