export interface LocalPoi {
  local_id: string;
  server_id?: string;
  lat: number;
  lng: number;
  title: string;
  note?: string;
  created_at: string;
  sync_status: "pending" | "synced" | "failed";
}

export type PoiCategory =
  | "unset"
  | "viewpoint"
  | "food"
  | "nature"
  | "parking"
  | "camp"
  | "beach"
  | "photo"
  | "other";
export type PoiVisibility = "private" | "shared" | "public";
export type PoiVisitStatus = "visited" | "planned";

export interface UserPlace {
  id: string;
  userId: string;
  placeId: string;
  title: string;
  lat: number;
  lng: number;
  category: PoiCategory;
  note: string | null;
  visibility: PoiVisibility;
  visitStatus: PoiVisitStatus;
  createdAt: string;
  updatedAt: string;
}
