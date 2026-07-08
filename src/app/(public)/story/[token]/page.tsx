import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Story, StoryCard, Trip, TripPoint } from '@/lib/types';
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

function toTrip(row: Record<string, unknown>): Trip {
  return {
    id: row.id as string,
    name: row.name as string,
    startedAt: row.started_at as string,
    endedAt: (row.ended_at as string) || null,
    distanceMeters: row.distance_meters as number,
    isLive: row.is_live as boolean,
    shareToken: (row.share_token as string) || null,
    source: (row.source as Trip['source']) || null,
  };
}

function toTripPoint(row: Record<string, unknown>): TripPoint {
  return {
    lat: row.lat as number,
    lng: row.lng as number,
    recordedAt: row.recorded_at as string,
  };
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

  // Trip data is not part of the RPC — fetch separately if story has a trip
  // The RPC doesn't return trip_id, so we look it up via the story id
  const { data: storyTripRow } = await supabase
    .from('stories')
    .select('trip_id')
    .eq('id', story.id)
    .single();

  let trip: Trip | null = null;
  let tripPoints: TripPoint[] = [];

  if (storyTripRow?.trip_id) {
    const { data: tripRow } = await supabase
      .from('trips')
      .select('*')
      .eq('id', storyTripRow.trip_id)
      .single();

    trip = tripRow ? toTrip(tripRow) : null;

    if (trip) {
      const { data: points } = await supabase
        .from('trip_points')
        .select('lat, lng, recorded_at')
        .eq('trip_id', trip.id)
        .order('recorded_at');
      tripPoints = (points || []).map(toTripPoint);
    }
  }

  return <StoryViewer story={story} cards={cards} trip={trip} tripPoints={tripPoints} />;
}
