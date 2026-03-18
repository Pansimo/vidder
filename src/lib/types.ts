export interface LocalPoi {
  local_id: string;
  server_id?: string;
  lat: number;
  lng: number;
  title: string;
  note?: string;
  created_at: string;
  sync_status: "pending" | "synced" | "failed";
}

export type PoiCategory =
  | "unset"
  | "viewpoint"
  | "food"
  | "nature"
  | "parking"
  | "camp"
  | "beach"
  | "photo"
  | "other";
export type PoiVisibility = "private" | "shared" | "public";
export type PoiVisitStatus = "visited" | "planned";

export interface UserPlace {
  id: string;
  userId: string;
  placeId: string | null; // null for private places
  title: string;
  lat: number;
  lng: number;
  category: PoiCategory;
  note: string | null;
  visibility: PoiVisibility;
  visitStatus: PoiVisitStatus;
  isFavorite: boolean;
  wantToVisit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  distanceMeters: number;
  isLive: boolean;
  shareToken: string | null;
}

export interface TripPoint {
  lat: number;
  lng: number;
  recordedAt: string;
}

// Story types

export type StoryStatus = 'draft' | 'shared';
export type StoryCardType = 'intro' | 'place' | 'transition' | 'outro' | 'day';

export interface Story {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  generatedAt: string;
  cardCount: number;
  status: StoryStatus;
  coverImageUrl: string | null;
  shareToken: string | null;
  sharedAt: string | null;
}

export interface StoryCard {
  id: string;
  storyId: string;
  cardType: StoryCardType;
  position: number;
  voiId: string | null;
  data: StoryCardData;
  createdAt: string;
}

export type StoryCardData =
  | IntroCardData
  | PlaceCardData
  | TransitionCardData
  | OutroCardData
  | DayCardData;

export interface IntroCardData {
  [key: string]: unknown;
  trip_name: string;
  started_at: string;
  ended_at: string;
  distance_meters: number;
  place_count: number;
  transport_mode: string;
  has_route: boolean;
  route_image_overlay?: string;
  points_image_overlay?: string;
  map_style: string;
  map_size: string;
  map_padding: number;
  voi_points?: Array<{ lat: number; lng: number; title: string }>;
}

export interface PlaceCardData {
  [key: string]: unknown;
  title: string;
  lat: number;
  lng: number;
  note?: string;
  category: string;
  created_at: string;
  thumbnail_url?: string;
  is_favorite?: boolean;
}

export interface TransitionCardData {
  [key: string]: unknown;
  from_title: string;
  from_lat: number;
  from_lng: number;
  to_title: string;
  to_lat: number;
  to_lng: number;
  distance_meters: number;
  map_image_overlay?: string;
  map_style: string;
  map_size: string;
  map_padding: number;
}

export interface OutroCardData {
  [key: string]: unknown;
  trip_name: string;
  started_at: string;
  ended_at: string;
  distance_meters: number;
  duration_minutes: number;
  place_count: number;
  transport_mode: string;
  has_route: boolean;
  route_image_overlay?: string;
  points_image_overlay?: string;
  map_style: string;
  map_size: string;
  map_padding: number;
}

export interface DayCardData {
  [key: string]: unknown;
  day_number: number;
  date: string;
  weekday: number;
}
