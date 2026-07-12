'use client';

import type { StoryCardData, SubHeaderCardData } from '@/lib/types';

interface SubHeaderCardProps {
  data: StoryCardData;
}

export default function SubHeaderCard({ data }: SubHeaderCardProps) {
  const d = data as SubHeaderCardData;

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center px-8"
      style={{ backgroundColor: '#F0F2F5' }}
    >
      <div className="mb-6 h-px w-10 bg-gray-300" />
      {d.title && (
        <h2 className="mb-2 text-center text-[24px] font-bold text-gray-800">
          {d.title}
        </h2>
      )}
      {d.text && (
        <p className="max-w-[320px] text-center text-[15px] leading-relaxed text-gray-500">
          {d.text}
        </p>
      )}
      <div className="mt-6 h-px w-10 bg-gray-300" />
    </div>
  );
}
