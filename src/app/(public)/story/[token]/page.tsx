import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Story, StoryCard, Trip, TripPoint } from '@/lib/types';
import StoryViewer from './StoryViewer';

interface PageProps {
  params: Promise<{ token: string }>;
}

function toStory(row: Record<string, unknown>): Story {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    userId: row.user_id as string,
    title: row.title as string,
    generatedAt: row.generated_at as string,
    cardCount: row.card_count as number,
    status: row.status as Story['status'],
    coverImageUrl: (row.cover_image_url as string) || null,
    shareToken: (row.share_token as string) || null,
    sharedAt: (row.shared_at as string) || null,
  };
}

function toStoryCard(row: Record<string, unknown>): StoryCard {
  return {
    id: row.id as string,
    storyId: row.story_id as string,
    cardType: row.card_type as StoryCard['cardType'],
    position: row.position as number,
    voiId: (row.voi_id as string) || null,
    data: row.data as StoryCard['data'],
    createdAt: row.created_at as string,
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
  const { data: story } = await supabase
    .from('stories')
    .select('title, cover_image_url')
    .eq('share_token', token)
    .eq('status', 'shared')
    .single();

  if (!story) return { title: 'Vidder' };

  return {
    title: `${story.title} — Vidder`,
    description: `Se resan "${story.title}" på Vidder`,
    openGraph: {
      title: `${story.title} — Vidder`,
      description: `Se resan "${story.title}" på Vidder`,
      ...(story.cover_image_url ? { images: [story.cover_image_url] } : {}),
    },
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { token } = await params;

  if (!/^[A-Z0-9]{4,12}$/i.test(token)) notFound();

  const supabase = await createClient();

  const { data: storyRow } = await supabase
    .from('stories')
    .select('*')
    .eq('share_token', token)
    .eq('status', 'shared')
    .single();

  if (!storyRow) notFound();

  const story = toStory(storyRow);

  const [cardsResult, tripResult] = await Promise.all([
    supabase
      .from('story_cards')
      .select('*')
      .eq('story_id', story.id)
      .order('position'),
    supabase
      .from('trips')
      .select('*')
      .eq('id', story.tripId)
      .single(),
  ]);

  const cards = (cardsResult.data || []).map(toStoryCard);
  const trip = tripResult.data ? toTrip(tripResult.data) : null;

  let tripPoints: TripPoint[] = [];
  if (trip) {
    const { data } = await supabase
      .from('trip_points')
      .select('lat, lng, recorded_at')
      .eq('trip_id', trip.id)
      .order('recorded_at');
    tripPoints = (data || []).map(toTripPoint);
  }

  return <StoryViewer story={story} cards={cards} trip={trip} tripPoints={tripPoints} />;
}
