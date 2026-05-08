-- RPC-funktioner för curated_areas och curated_pois
-- Hanterar geography-konvertering från vanliga lat/lng floats
-- Kör manuellt i Supabase Studio (SQL Editor)

-- ─── upsert_curated_area ────────────────────────────────────────
-- SECURITY INVOKER = RLS gäller
create or replace function public.upsert_curated_area(
  p_id text,
  p_name text,
  p_level int,
  p_parent_area_id text default null,
  p_type text default 'mixed',
  p_character_tags text[] default '{}',
  p_short_intro text default null,
  p_character text default null,
  p_hero_image_url text default null,
  p_bbox_sw_lat double precision default null,
  p_bbox_sw_lng double precision default null,
  p_bbox_ne_lat double precision default null,
  p_bbox_ne_lng double precision default null,
  p_centroid_lat double precision default null,
  p_centroid_lng double precision default null,
  p_ready_for_app boolean default false,
  p_naming_priority int default 50,
  p_status text default 'draft'
)
returns text
language plpgsql
security invoker
as $$
begin
  insert into public.curated_areas (
    id, name, level, parent_area_id, type, character_tags,
    short_intro, character, hero_image_url,
    bbox_sw_lat, bbox_sw_lng, bbox_ne_lat, bbox_ne_lng,
    centroid, ready_for_app, naming_priority, status
  ) values (
    p_id, p_name, p_level, p_parent_area_id, p_type, p_character_tags,
    p_short_intro, p_character, p_hero_image_url,
    p_bbox_sw_lat, p_bbox_sw_lng, p_bbox_ne_lat, p_bbox_ne_lng,
    case when p_centroid_lat is not null and p_centroid_lng is not null
      then ST_SetSRID(ST_MakePoint(p_centroid_lng, p_centroid_lat), 4326)::geography
      else null
    end,
    p_ready_for_app, p_naming_priority, p_status
  )
  on conflict (id) do update set
    name = excluded.name,
    type = excluded.type,
    character_tags = excluded.character_tags,
    short_intro = excluded.short_intro,
    character = excluded.character,
    hero_image_url = excluded.hero_image_url,
    bbox_sw_lat = excluded.bbox_sw_lat,
    bbox_sw_lng = excluded.bbox_sw_lng,
    bbox_ne_lat = excluded.bbox_ne_lat,
    bbox_ne_lng = excluded.bbox_ne_lng,
    centroid = excluded.centroid,
    ready_for_app = excluded.ready_for_app,
    naming_priority = excluded.naming_priority,
    status = excluded.status;

  return p_id;
end;
$$;


-- ─── get_area_centroid ──────────────────────────────────────────
-- Extraherar centroid lat/lng som vanliga floats
create or replace function public.get_area_centroid(area_id text)
returns json
language sql
stable
security invoker
as $$
  select json_build_object(
    'lat', ST_Y(centroid::geometry),
    'lng', ST_X(centroid::geometry)
  )
  from public.curated_areas
  where id = area_id;
$$;


-- ─── upsert_curated_poi ─────────────────────────────────────────
create or replace function public.upsert_curated_poi(
  p_id text,
  p_name text,
  p_area_id text,
  p_category text,
  p_lat double precision,
  p_lng double precision,
  p_character_tags text[] default '{}',
  p_short_description text default null,
  p_description text default null,
  p_hero_image_url text default null,
  p_external_url text default null,
  p_seasonality text default 'year_round',
  p_accessibility_note text default null,
  p_is_featured boolean default false,
  p_display_priority int default 50,
  p_status text default 'draft'
)
returns text
language plpgsql
security invoker
as $$
begin
  insert into public.curated_pois (
    id, name, area_id, category, location, character_tags,
    short_description, description, hero_image_url, external_url,
    seasonality, accessibility_note, is_featured, display_priority, status
  ) values (
    p_id, p_name, p_area_id, p_category,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_character_tags,
    p_short_description, p_description, p_hero_image_url, p_external_url,
    p_seasonality, p_accessibility_note, p_is_featured, p_display_priority, p_status
  )
  on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    location = excluded.location,
    character_tags = excluded.character_tags,
    short_description = excluded.short_description,
    description = excluded.description,
    hero_image_url = excluded.hero_image_url,
    external_url = excluded.external_url,
    seasonality = excluded.seasonality,
    accessibility_note = excluded.accessibility_note,
    is_featured = excluded.is_featured,
    display_priority = excluded.display_priority,
    status = excluded.status;

  return p_id;
end;
$$;
