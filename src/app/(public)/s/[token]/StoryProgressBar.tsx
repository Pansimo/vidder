'use client';

interface StoryProgressBarProps {
  total: number;
  current: number;
}

export default function StoryProgressBar({ total, current }: StoryProgressBarProps) {
  return (
    <div className="flex gap-1 px-4 py-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-0.5 flex-1 rounded-full transition-colors duration-300"
          style={{
            backgroundColor: i <= current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </div>
  );
}
