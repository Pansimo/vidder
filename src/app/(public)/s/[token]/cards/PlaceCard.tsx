'use client';

import type { StoryCardData, PlaceCardData } from '@/lib/types';
import { categoryEmoji, categoryLabel, formatTime } from '../storyUtils';

interface PlaceCardProps {
  data: StoryCardData;
}

export default function PlaceCard({ data }: PlaceCardProps) {
  const d = data as PlaceCardData;
  const hasImage = !!d.thumbnail_url;

  return (
    <div className="relative flex h-full w-full flex-col justify-end" style={{ backgroundColor: '#1A1A2E' }}>
      {/* Background image or placeholder */}
      {hasImage ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.thumbnail_url} alt={d.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)',
          }} />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl">{categoryEmoji(d.category)}</div>
            <p className="mt-2 text-sm text-white/50">{categoryLabel(d.category)}</p>
          </div>
        </div>
      )}

      {/* Favorite star */}
      {d.is_favorite && (
        <div className="absolute top-20 right-4 z-10 text-2xl" style={{ color: '#B45309' }}>
          ★
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 px-6 pb-12">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-sm">{categoryEmoji(d.category)}</span>
          <span className="text-[13px] font-medium text-white/70">{categoryLabel(d.category)}</span>
        </div>

        <h2 className="mb-1 text-[26px] font-bold leading-tight text-white">
          {d.title}
        </h2>

        <p className="mb-2 text-sm text-white/60">
          {formatTime(d.created_at)}
        </p>

        {d.note && (
          <p className="line-clamp-4 text-[15px] leading-relaxed text-white/80">
            {d.note}
          </p>
        )}
      </div>
    </div>
  );
}
