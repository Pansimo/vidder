'use client';

import type { StoryCardData, OutroCardData } from '@/lib/types';
import {
  transportEmoji,
  formatDistance,
  formatDuration,
  formatDateRange,
  mapboxStaticUrl,
} from '../storyUtils';

interface OutroCardProps {
  data: StoryCardData;
}

export default function OutroCard({ data }: OutroCardProps) {
  const d = data as OutroCardData;
  const overlay = d.route_image_overlay || d.points_image_overlay;
  const mapUrl = overlay
    ? mapboxStaticUrl(overlay, d.map_style || 'dark-v11', d.map_size || '800x600@2x', d.map_padding || 60)
    : null;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center" style={{ backgroundColor: '#0A0A2E' }}>
      {/* Map background */}
      {mapUrl && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mapUrl} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(10,10,46,0.5) 0%, rgba(10,10,46,0.9) 100%)',
          }} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/50">
          Resa avslutad
        </p>
        <h2 className="mb-1 text-center text-[28px] font-bold text-white">
          {d.trip_name}
        </h2>
        <p className="mb-8 text-[15px] text-white/60">
          {formatDateRange(d.started_at, d.ended_at)}
        </p>

        {/* Stats grid */}
        <div className="mb-10 flex flex-wrap justify-center gap-4">
          <StatTile icon="📅" value={formatDateRange(d.started_at, d.ended_at)} label="Datum" />
          <StatTile icon="📏" value={formatDistance(d.distance_meters)} label="Distans" />
          <StatTile icon="⏱️" value={formatDuration(d.duration_minutes)} label="Tid" />
          <StatTile icon={transportEmoji(d.transport_mode)} value={`${d.place_count}`} label="Platser" />
        </div>

        {/* Close button */}
        <a
          href="https://vidder.app"
          className="rounded-[25px] px-12 py-3 text-base font-bold text-white"
          style={{ backgroundColor: '#0009AB' }}
        >
          Klar
        </a>
      </div>
    </div>
  );
}

function StatTile({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex w-[140px] flex-col items-center gap-1 rounded-2xl bg-white/8 px-4 py-3">
      <span className="text-lg">{icon}</span>
      <span className="text-lg font-bold text-white">{value}</span>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  );
}
