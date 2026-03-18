# CLAUDE.md — Vidder Web

Uppdaterad: 2026-03-17

## Vad är detta?

Vidder är en mobil resedagbok (iOS primärt). Grundidén: spara var du är på under 2 sekunder, berika platsen senare.

**Webbappen har två use cases:**
1. **Admin-vy** — inloggade användare hanterar sina platser/resor/stories i webbläsaren
2. **Publik story-visare** — delade stories på `/story/[token]`, ingen inloggning krävs

## Flutter-appen är referensen

Flutter-appen ligger på `~/Developer/vidder_flutter/`.
Läs `~/Developer/vidder_flutter/CLAUDE.md` för fullständig domänkunskap — begrepp, datamodell, färger, UX-beslut.

Webbappen ska spegla Flutter-appen så nära som möjligt.

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first config, inga tailwind.config.js)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Karta**: MapLibre GL med Mapbox tiles
- **Hosting**: Vercel
- **Font**: Nunito (matchar Flutter-appen)

## Kommandon

```bash
npm run dev      # lokal dev-server på http://localhost:3000
npm run build    # produktionsbygge
npm run lint     # ESLint
```

## Miljövariabler (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://xrpqitzvjkspcrvbfoov.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiZ2FsZW50byIs...
NEXT_PUBLIC_APP_URL=https://vidder.vercel.app
```

## Filstruktur (aktuell)

```
src/
├── middleware.ts              — session-refresh + auth-guard på /admin/*
├── app/
│   ├── (public)/             — publika routes, ingen auth krävs
│   │   └── story/[token]/    — publik story-visare (Sprint 1)
│   ├── (admin)/              — kräver inloggning (middleware-skyddad)
│   │   └── admin/page.tsx    — stories dashboard
│   ├── app/                  — befintliga komponenter
│   │   ├── AppShell.tsx
│   │   ├── MapView.tsx
│   │   ├── PlacesList.tsx
│   │   ├── PlacesManager.tsx
│   │   ├── PlacesManagerMap.tsx
│   │   ├── TripsView.tsx
│   │   ├── BottomNav.tsx
│   │   ├── LogoutButton.tsx
│   │   └── page.tsx          — huvud app-sida (kräver auth)
│   ├── api/                  — API routes
│   ├── auth/callback/        — OAuth callback (Google)
│   ├── login/                — inloggningssida
│   ├── resa/[token]/         — befintlig trip share-sida
│   ├── globals.css           — Vidder design tokens
│   ├── layout.tsx            — root layout med Nunito
│   └── page.tsx              — root redirect
└── lib/
    ├── types.ts              — alla TypeScript-typer (speglar Flutter-modeller)
    ├── supabase/
    │   ├── server.ts         — server-side Supabase-klient
    │   └── client.ts         — browser-side Supabase-klient
    ├── trips.ts              — trip-queries
    ├── user-places.ts        — user_places-queries
    ├── images.ts             — bildhantering
    └── db.ts                 — lokal databas (IndexedDB via idb)
```

## Varumärkesfärger (från Flutter CLAUDE.md)

| Namn | Hex | Användning |
|------|-----|------------|
| Primär blå | `#0009AB` | Knappar, accenter, aktiva element |
| Sekundär röd | `#DE2110` | Logotyp, fel, stop |
| Grön rutt | `#22C55E` | Aktiv resa, synkad |
| Privat pin | `#16A34A` | Privat VOI |
| Delad pin | `#0009AB` | Delad/grupp VOI |
| Publik pin | `#F97316` | Publik VOI |

## Supabase-schema (relevanta tabeller)

- **user_places** — `id`, `user_id`, `place_id`, `title`, `note`, `lat`, `lng`, `category`, `visibility`, `is_favorite`, `want_to_visit`, `is_recommended`, `thumbnail_url`, `created_at`, `updated_at`
- **trips** — `id`, `user_id`, `name`, `started_at`, `ended_at`, `status`, `distance_meters`, `transport_mode`, `share_token`, `is_live`
- **trip_points** — `id`, `trip_id`, `lat`, `lng`, `altitude`, `speed`, `recorded_at`
- **stories** — `id`, `trip_id`, `user_id`, `title`, `generated_at`, `card_count`, `status`, `cover_image_url`, `share_token`, `shared_at`
- **story_cards** — `id`, `story_id`, `card_type`, `position`, `voi_id`, `data` (jsonb), `created_at`
- **profiles** — `id`, `username`, `first_name`, `last_name`, `avatar_url`, `visibility`

## Story-kort (card_type + data-nycklar)

Story-korten genereras av Flutter-appen och lagras i `story_cards.data` (JSONB):

**intro**: `trip_name`, `started_at`, `ended_at`, `distance_meters`, `place_count`, `transport_mode`, `has_route`, `route_image_overlay`, `points_image_overlay`, `map_style`, `map_size`, `map_padding`, `voi_points`

**place**: `title`, `lat`, `lng`, `note`, `category`, `created_at`, `thumbnail_url`, `is_favorite`

**transition**: `from_title`, `from_lat`, `from_lng`, `to_title`, `to_lat`, `to_lng`, `distance_meters`, `map_image_overlay`, `map_style`, `map_size`, `map_padding`

**outro**: `trip_name`, `started_at`, `ended_at`, `distance_meters`, `duration_minutes`, `place_count`, `transport_mode`, `has_route`, `route_image_overlay`, `points_image_overlay`, `map_style`, `map_size`, `map_padding`

**day**: `day_number`, `date`, `weekday`

Kartbilder byggs via Mapbox Static Images API:
`https://api.mapbox.com/styles/v1/mapbox/{style}/static/{overlay}/auto/{size}?access_token={token}&padding={padding}`

## Aktuella problem att lösa

1. **Inloggning fungerar inte** — felet "Legacy API keys are disabled" visas.
   - Ny anon-nyckel (`eyJ...`) är satt i `.env.local`
   - Trolig orsak: fel komponent renderas eller Supabase-klienten använder gammal nyckel från cache
   - Kolla `src/app/login/` och `src/lib/supabase/client.ts`

2. **Publik story-visare saknas** — `/story/[token]` ska visa story-kort
   - Filer finns i `src/app/(public)/story/[token]/`
   - Kontrollera att RLS-policy tillåter anonym läsning av delade stories

## RLS-policies som krävs

```sql
-- Publik läsning av delade stories
CREATE POLICY "Public shared story read"
ON public.stories FOR SELECT
USING (share_token IS NOT NULL AND status = 'shared');

-- Publik läsning av story_cards för delade stories
CREATE POLICY "Public shared story_cards read"
ON public.story_cards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_cards.story_id
    AND s.share_token IS NOT NULL
    AND s.status = 'shared'
  )
);
```

## Byggordning (prioritet)

1. Fixa inloggning (e-post + Google)
2. Verifiera att `/app` (admin-vyn) fungerar efter inloggning
3. Publik story-visare `/story/[token]`
4. Admin: platslista `/admin/places`
5. Admin: kartvy med MapLibre-markörer
