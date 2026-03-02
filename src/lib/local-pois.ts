import type { LocalPoi } from "./types";

const STORAGE_KEY = "vidder_pois";

export function loadLocalPois(): LocalPoi[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalPoi[]) : [];
  } catch {
    return [];
  }
}

export function saveAllLocalPois(pois: LocalPoi[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pois));
  } catch {}
}

export function addLocalPoi(poi: LocalPoi): LocalPoi[] {
  const pois = [...loadLocalPois(), poi];
  saveAllLocalPois(pois);
  return pois;
}

export function updateLocalPoi(
  local_id: string,
  updates: Partial<LocalPoi>
): LocalPoi[] {
  const pois = loadLocalPois().map((p) =>
    p.local_id === local_id ? { ...p, ...updates } : p
  );
  saveAllLocalPois(pois);
  return pois;
}
