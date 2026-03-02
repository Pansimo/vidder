# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vidder is a travel discovery PWA — a personal place diary for spontaneous discoveries during travel. Users capture GPS locations in under 2 seconds, then enrich them later. The map is the primary interface.

**Core principle: "Spara först — redigera senare" (Save first, edit later). No required fields at save time.**

## Tech Stack

- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **Map**: Mapbox or MapLibre
- **Offline**: IndexedDB + sync queue
- **Target**: PWA (iPhone, Android, browser)

## Development Commands

The project has not been initialized yet. Expected commands once scaffolded:

```bash
npm run dev        # local dev server
npm run build      # production build
npm run lint       # lint
```

## Architecture

### Navigation Structure

Three-tab bottom navigation:
1. **Karta (Map)** — start screen, always opens first
2. **Spara (Save)** — quick place capture
3. **Mina platser (My places)** — personal archive

A floating ➕ button on the map triggers instant place save.

### Map startup priority
1. Last used map position
2. User's current GPS position
3. Default view (first launch)

### Data Model (Supabase)

**profiles** — linked to `auth.users` (id, display_name, created_at)

**pois** — personal place discoveries:
- `id`, `user_id`, `title`, `note`
- `lat`, `lng` (coordinates)
- `location_type`: point | area | viewpoint | parking | camp | nature | other
- `radius_m`, `bearing_deg`
- `visibility`: private (default) | shared | public
- `visited_at`, `created_at`, `updated_at`

**poi_images** — (id, poi_id, user_id, storage_path, created_at)

**Client-side offline fields**: `local_id`, `sync_status` (pending/synced/failed), `last_synced_at`

### RLS Rules
- Users can only read/write their own `pois` and `poi_images`
- No global place database — each POI is always one user's personal discovery

### Offline-First
- Local IndexedDB is always the primary store
- Server is not the source of truth
- Auto-sync queue runs when connectivity is restored
- App must work fully offline: open, view saved places, save new places, take photos, write notes

## Development Order (from VIDDER_DEV_PLAN.md)

Build in this sequence — always prioritize working over fast over pretty:

1. **Fas 1**: Next.js + TypeScript + Tailwind init, deploy empty app to Vercel
2. **Fas 2**: Supabase auth (login/logout), profiles table
3. **Fas 3**: Map as main view, GPS position, bottom navigation
4. **Fas 4**: ➕ Save button, GPS capture, local POI creation, map marker
5. **Fas 5**: Supabase pois table, RLS, sync to/from server
6. **Fas 6**: IndexedDB, sync_status, sync queue, auto-sync on reconnect
7. **Fas 7**: "My places" list, filter, detail view
8. **Fas 8**: Image upload (Supabase Storage), notes, POI editing → MVP complete

## Key Design Decisions

- Place save must complete in ≤ 2 seconds — GPS capture must be non-blocking
- Mobile-first layout throughout
- Visibility defaults to **private** for all new places
- Each user's POIs are independent even if they share the same geographic location
- Recommended database indexes: `user_id`, geo-index on `lat/lng`, `created_at`
