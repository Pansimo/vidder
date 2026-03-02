import { openDB, type IDBPDatabase } from "idb";
import type { LocalPoi } from "./types";

const DB_NAME = "vidder";
const STORE = "pois";
const VERSION = 1;

let _db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: "local_id" });
      store.createIndex("sync_status", "sync_status");
      store.createIndex("created_at", "created_at");
    },
  });
  return _db;
}

export async function getAllPois(): Promise<LocalPoi[]> {
  const db = await getDb();
  const pois = (await db.getAll(STORE)) as LocalPoi[];
  return pois.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function putPoi(poi: LocalPoi): Promise<void> {
  const db = await getDb();
  await db.put(STORE, poi);
}

export async function putAllPois(pois: LocalPoi[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  await Promise.all(pois.map((p) => tx.store.put(p)));
  await tx.done;
}

export async function getPendingPois(): Promise<LocalPoi[]> {
  const db = await getDb();
  return (await db.getAllFromIndex(STORE, "sync_status", "pending")) as LocalPoi[];
}

export async function updatePoiFields(
  local_id: string,
  fields: Partial<Pick<LocalPoi, "title" | "note">>
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  const poi = (await tx.store.get(local_id)) as LocalPoi | undefined;
  if (poi) {
    await tx.store.put({ ...poi, ...fields });
  }
  await tx.done;
}

export async function updatePoiSync(
  local_id: string,
  server_id: string
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  const poi = (await tx.store.get(local_id)) as LocalPoi | undefined;
  if (poi) {
    await tx.store.put({ ...poi, server_id, sync_status: "synced" });
  }
  await tx.done;
}
