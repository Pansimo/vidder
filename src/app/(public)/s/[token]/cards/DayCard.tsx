'use client';

import type { StoryCardData, DayCardData } from '@/lib/types';
import { weekdayName, formatDate } from '../storyUtils';

interface DayCardProps {
  data: StoryCardData;
}

export default function DayCard({ data }: DayCardProps) {
  const d = data as DayCardData;

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center"
      style={{ backgroundColor: '#0009AB' }}
    >
      {/* Top line */}
      <div className="mb-6 h-px w-10 bg-white/30" />

      <p className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-white/60">
        Dag {d.day_number}
      </p>

      <h2 className="mb-1 text-[28px] font-bold text-white">
        {formatDate(d.date)}
      </h2>

      <p className="text-sm capitalize text-white/70">
        {weekdayName(d.weekday)}
      </p>

      {/* Bottom line */}
      <div className="mt-6 h-px w-10 bg-white/30" />
    </div>
  );
}
