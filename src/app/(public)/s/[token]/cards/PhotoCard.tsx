'use client';

import type { StoryCardData, PhotoCardData } from '@/lib/types';

interface PhotoCardProps {
  data: StoryCardData;
}

export default function PhotoCard({ data }: PhotoCardProps) {
  const d = data as PhotoCardData;
  const hasImage = !!d.thumbnail_url;

  return (
    <div className="relative flex h-full w-full items-center justify-center" style={{ backgroundColor: '#1A1A2E' }}>
      {hasImage ? (
        <>
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.thumbnail_url} alt={d.title || d.caption || 'Foto'} className="h-full w-full object-cover" />
          </div>
          {/* Caption overlay */}
          {(d.caption || d.title) && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-6 pb-10 pt-16">
              <p className="text-lg font-bold text-white">{d.title || d.caption}</p>
              {d.title && d.caption && (
                <p className="mt-1 text-sm text-white/70">{d.caption}</p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-white/50">
          <span className="text-5xl">📷</span>
          {(d.title || d.caption) && (
            <p className="mt-2 max-w-[260px] text-center text-sm font-medium">{d.title || d.caption}</p>
          )}
        </div>
      )}
    </div>
  );
}
