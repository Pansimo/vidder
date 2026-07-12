'use client';

import type { StoryCardData, IntroCardData } from '@/lib/types';
import {
  transportEmoji,
  formatDistance,
  formatDateRange,
  mapboxStaticUrl,
} from '../storyUtils';

interface IntroCardProps {
  data: StoryCardData;
  onStart: () => void;
}

export default function IntroCard({ data, onStart }: IntroCardProps) {
  const d = data as IntroCardData;
  const overlay = d.route_image_overlay || d.points_image_overlay;
  const mapUrl = overlay
    ? mapboxStaticUrl(overlay, d.map_style || 'dark-v11', d.map_size || '800x600@2x', d.map_padding || 60)
    : null;

  return (
    <div className="relative flex h-full w-full flex-col justify-end" style={{ backgroundColor: '#0A0A2E' }}>
      {/* Map background */}
      {mapUrl && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mapUrl} alt="" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(10,10,46,0.4) 0%, rgba(10,10,46,0.9) 100%)',
          }} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 px-6 pb-12">
        <div className="mb-2 text-4xl">{transportEmoji(d.transport_mode)}</div>
        <h1 className="mb-2 text-[32px] font-bold leading-tight text-white">
          {d.trip_name}
        </h1>
        <p className="mb-6 text-base text-white/60">
          {formatDateRange(d.started_at, d.ended_at)}
        </p>

        {/* Stats */}
        <div className="mb-8 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/12 px-3 py-1.5 text-sm text-white">
            📍 {d.place_count} platser
          </span>
          <span className="rounded-full bg-white/12 px-3 py-1.5 text-sm text-white">
            📏 {formatDistance(d.distance_meters)}
          </span>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="w-full rounded-[26px] py-3.5 text-base font-bold text-white"
          style={{ backgroundColor: '#0009AB' }}
        >
          Starta story →
        </button>
      </div>
    </div>
  );
}
