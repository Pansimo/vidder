"use client";

import dynamic from "next/dynamic";
import type { Trip } from "@/lib/types";

const TripShareClient = dynamic(() => import("./TripShareClient"), { ssr: false });

export default function TripShareWrapper({ trip }: { trip: Trip }) {
  return <TripShareClient trip={trip} />;
}
