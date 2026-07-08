import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Story, StoryCard } from '@/lib/types';
import StoryViewer from './StoryViewer';

interface PageProps {
  params: Promise<{ token: string }>;
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
  if (!/^[A-Z0-9]{4,12}$/i.test(token)) return { title: 'Vidder' };

  const supabase = await createClient();
  const { data } = await supabase.rpc('get_shared_story', { p_token: token });

  if (!data) return { title: 'Vidder' };

  const { story } = data as RpcResponse;

  return {
    title: `${story.title} — Vidder`,
    description: `Se resan "${story.title}" på Vidder`,
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { token } = await params;

  if (!/^[A-Z0-9]{4,12}$/i.test(token)) notFound();

  const supabase = await createClient();

  const { data } = await supabase.rpc('get_shared_story', { p_token: token });

  if (!data) notFound();

  const rpc = data as RpcResponse;
  const story = rpcToStory(rpc.story);
  const cards = rpc.cards.map((c) => rpcToStoryCard(c, story.id));
  const routePoints = extractRoutePoints(rpc.cards);

  return <StoryViewer story={story} cards={cards} routePoints={routePoints} />;
}
