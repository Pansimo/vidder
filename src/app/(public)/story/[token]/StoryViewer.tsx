'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Story, StoryCard, Trip, TripPoint } from '@/lib/types';
import StoryProgressBar from './StoryProgressBar';
import StoryMapTab from './StoryMapTab';
import IntroCard from './cards/IntroCard';
import PlaceCard from './cards/PlaceCard';
import TransitionCard from './cards/TransitionCard';
import OutroCard from './cards/OutroCard';
import DayCard from './cards/DayCard';
import type { PlaceCardData } from '@/lib/types';

interface StoryViewerProps {
  story: Story;
  cards: StoryCard[];
  trip: Trip | null;
  tripPoints: TripPoint[];
}

export default function StoryViewer({ story, cards, trip, tripPoints }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tab, setTab] = useState<'story' | 'map'>('story');
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const hasMap = tripPoints.length > 0;
  const places = cards
    .filter((c) => c.cardType === 'place')
    .map((c) => c.data as PlaceCardData);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, cards.length - 1)));
    },
    [cards.length],
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }

  function handleTouchEnd() {
    if (touchDeltaX.current < -50) next();
    else if (touchDeltaX.current > 50) prev();
    touchDeltaX.current = 0;
  }

  function handleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;
    const x = e.clientX;
    const w = window.innerWidth;
    if (x > w / 2) next();
    else prev();
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: story.title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  function renderCard(card: StoryCard) {
    switch (card.cardType) {
      case 'intro':
        return <IntroCard data={card.data} onStart={next} />;
      case 'place':
        return <PlaceCard data={card.data} />;
      case 'transition':
        return <TransitionCard data={card.data} />;
      case 'outro':
        return <OutroCard data={card.data} />;
      case 'day':
        return <DayCard data={card.data} />;
      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 bg-black font-[family-name:var(--font-nunito)]">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
        <StoryProgressBar total={cards.length} current={currentIndex} />
        <div className="flex items-center justify-between px-4 pb-2">
          {/* Close */}
          <a
            href="https://vidder.app"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </a>

          <div className="flex items-center gap-2">
            {/* Tab toggle */}
            {hasMap && tab === 'story' && (
              <button
                onClick={() => setTab('map')}
                className="rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Karta
              </button>
            )}
            {hasMap && tab === 'map' && (
              <button
                onClick={() => setTab('story')}
                className="rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Story
              </button>
            )}
            {/* Share */}
            <button
              onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Story cards */}
      {tab === 'story' && (
        <div
          ref={containerRef}
          className="group relative h-full w-full cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
        >
          {cards[currentIndex] && renderCard(cards[currentIndex])}

          {/* Navigation arrows — hidden on intro card (index 0) */}
          {currentIndex > 0 && (
            <div
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 opacity-20 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-40"
              aria-hidden="true"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
          )}
          {currentIndex < cards.length - 1 && currentIndex > 0 && (
            <div
              className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 opacity-20 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-40"
              aria-hidden="true"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Map tab */}
      {tab === 'map' && (
        <StoryMapTab tripPoints={tripPoints} places={places} />
      )}
    </div>
  );
}
