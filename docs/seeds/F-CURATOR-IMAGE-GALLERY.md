# F-CURATOR-IMAGE-GALLERY

Stod for flera bilder per area/POI.

## Bakgrund

Nuvarande implementation stodjer en hero-bild per area/POI. For rikare innehall behovs galleri med flera bilder.

## Designforslag

Ny tabell:

```sql
create table public.curated_images (
  id uuid primary key default gen_random_uuid(),
  area_id text references public.curated_areas(id) on delete cascade,
  poi_id text references public.curated_pois(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint one_parent check (
    (area_id is not null and poi_id is null) or
    (area_id is null and poi_id is not null)
  )
);
```

## UI

- Galleri-sektion i OmradeForm/PoiForm
- Thumbnails med drag-and-drop sortering
- "Satt som primary" per bild (ersatter hero_image_url)
- Bulk-upload (flera filer)

## Prioritet

Lag. Hor inte till v1. En hero-bild racker for lansering.
