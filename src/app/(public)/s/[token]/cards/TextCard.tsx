'use client';

import type { StoryCardData, TextCardData } from '@/lib/types';

interface TextCardProps {
  data: StoryCardData;
}

export default function TextCard({ data }: TextCardProps) {
  const d = data as TextCardData;

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center px-8"
      style={{ backgroundColor: '#0009AB' }}
    >
      {d.title && (
        <h2 className="mb-4 text-center text-[22px] font-bold text-white">
          {d.title}
        </h2>
      )}
      {d.text && (
        <p className="max-w-[340px] text-center text-[16px] leading-relaxed text-white/80">
          {d.text}
        </p>
      )}
      {!d.title && !d.text && (
        <p className="text-sm text-white/50">Textkort</p>
      )}
    </div>
  );
}
