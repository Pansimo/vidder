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
