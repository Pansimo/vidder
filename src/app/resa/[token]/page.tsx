export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/lib/types";
import TripShareWrapper from "./TripShareWrapper";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function TripSharePage({ params }: Props) {
  const { token } = await params;

  if (!/^[A-Z0-9]{4,12}$/i.test(token)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("id, name, started_at, ended_at, distance_meters, is_live, share_token, source")
    .eq("share_token", token)
    .maybeSingle();

  if (!data) notFound();

  const trip: Trip = {
    id: data.id,
    name: data.name ?? "",
    startedAt: data.started_at,
    endedAt: data.ended_at ?? null,
    distanceMeters: data.distance_meters ?? 0,
    isLive: data.is_live ?? false,
    shareToken: data.share_token ?? null,
    source: data.source ?? null,
  };

  return <TripShareWrapper trip={trip} />;
}
