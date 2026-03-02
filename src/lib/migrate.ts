import { getAllPois, putAllPois } from "./db";
import type { LocalPoi } from "./types";

const LEGACY_KEY = "vidder_pois";

/**
 * One-time migration from localStorage (Fas 4/5) to IndexedDB (Fas 6).
 * Safe to call on every startup — no-ops if IndexedDB already has data
 * or if localStorage is empty.
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const existing = await getAllPois();
    if (existing.length > 0) return;

    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;

    const pois = JSON.parse(raw) as LocalPoi[];
    if (Array.isArray(pois) && pois.length > 0) {
      await putAllPois(pois);
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch {
    // Migration failure is non-fatal — local data may be lost but app stays working
  }
}
