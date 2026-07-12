import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Story, StoryCard } from '@/lib/types';
import StoryViewer from './StoryViewer';

interface PageProps {
  params: Promise<{ token: string }>;
}

const SHORT_CODE_RE = /^[A-Z0-9]{4,12}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidToken(token: string): boolean {
  return SHORT_CODE_RE.test(token) || UUID_RE.test(token);
}

interface RpcStory {
  id: string;
  user_id: string;
  title: string;
  generated_at: string;
  card_count: number;
  share_token: string;
  shared_at: string | null;
  source_type?: string;
  note?: string;
  theme_id?: string;
  layout_template?: string;
}

interface RpcCard {
  id: string;
  card_type: string;
  position: number;
  voi_id: string | null;
  data: Record<string, unknown>;
  created_at: string;
  layout?: string;
}

interface RpcResponse {
  story: RpcStory;
  cards: RpcCard[];
}

function rpcToStory(s: RpcStory): Story {
  return {
    id: s.id,
    tripId: '', // not returned by RPC; trip data fetched separately if needed
    userId: s.user_id,
    title: s.title,
    generatedAt: s.generated_at,
    cardCount: s.card_count,
    status: 'shared', // RPC only returns shared stories
    coverImageUrl: null, // not returned by RPC
    shareToken: s.share_token,
    sharedAt: s.shared_at,
  };
}

function rpcToStoryCard(c: RpcCard, storyId: string): StoryCard {
  return {
    id: c.id,
    storyId,
    cardType: c.card_type as StoryCard['cardType'],
    position: c.position,
    voiId: c.voi_id,
    data: c.data as StoryCard['data'],
    createdAt: c.created_at,
  };
}

/** Cached RPC call — deduplicates across generateMetadata + StoryPage per request. */
const fetchSharedStory = cache(async (token: string): Promise<RpcResponse | null> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_shared_story', { p_token: token });
  return (data as RpcResponse) ?? null;
});

/** Extract route points from route-type cards (sorted by position from RPC). */
function extractRoutePoints(cards: RpcCard[]): Array<{ lat: number; lng: number }> {
  return cards
    .filter((c) => c.card_type === 'route')
    .flatMap((c) => {
      const pts = c.data?.points;
      if (!Array.isArray(pts)) return [];
      return pts.map((p: { lat: number; lng: number }) => ({ lat: p.lat, lng: p.lng }));
    });
}

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  if (!isValidToken(token)) return { title: 'Vidder' };

  const rpc = await fetchSharedStory(token);
  if (!rpc) return { title: 'Vidder' };

  return {
    title: `${rpc.story.title} — Vidder`,
    description: `Se resan "${rpc.story.title}" på Vidder`,
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { token } = await params;

  if (!isValidToken(token)) notFound();

  const rpc = await fetchSharedStory(token);
  if (!rpc) notFound();

  const story = rpcToStory(rpc.story);
  const cards = rpc.cards.map((c) => rpcToStoryCard(c, story.id));
  const routePoints = extractRoutePoints(rpc.cards);

  return <StoryViewer story={story} cards={cards} routePoints={routePoints} />;
}
