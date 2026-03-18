'use client';

import type { StoryCardData, TransitionCardData } from '@/lib/types';
import { formatDistance, mapboxStaticUrl } from '../storyUtils';

interface TransitionCardProps {
  data: StoryCardData;
}

export default function TransitionCard({ data }: TransitionCardProps) {
  const d = data as TransitionCardData;
  const mapUrl = d.map_image_overlay
    ? mapboxStaticUrl(d.map_image_overlay, d.map_style || 'light-v11', d.map_size || '800x600@2x', d.map_padding || 80)
    : null;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-white">
      {/* Map background */}
      {mapUrl && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mapUrl} alt="" className="h-full w-full object-cover opacity-85" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 100%)',
          }} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-8">
        {/* From */}
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md">
          <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#0009AB' }}>
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <span className="max-w-[200px] truncate text-[15px] font-semibold text-gray-800">
            {d.from_title}
          </span>
        </div>

        {/* Line + distance */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-px" style={{ backgroundColor: 'rgba(0,9,171,0.3)' }} />
          <span className="rounded-full bg-white px-3 py-1 text-[15px] font-semibold text-gray-700 shadow-sm">
            {formatDistance(d.distance_meters)}
          </span>
          <div className="h-6 w-px" style={{ backgroundColor: 'rgba(0,9,171,0.3)' }} />
        </div>

        {/* To */}
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md">
          <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#DE2110' }}>
            <span className="text-xs font-bold text-white">B</span>
          </div>
          <span className="max-w-[200px] truncate text-[15px] font-semibold text-gray-800">
            {d.to_title}
          </span>
        </div>
      </div>
    </div>
  );
}
