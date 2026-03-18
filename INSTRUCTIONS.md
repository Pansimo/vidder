# INSTRUCTIONS.md — Vidder Web, Claude Code Körschema

Datum: 2026-03-17  
Projekt: ~/Developer/vidder_web/  
Ansvarig: Claude Code

---

## VIKTIGT — Läs alltid dessa filer först

Innan du gör något, läs:
1. `CLAUDE.md` i detta projekt (~/Developer/vidder_web/CLAUDE.md)
2. `~/Developer/vidder_flutter/CLAUDE.md` — Flutter-appen är referensen

---

## REGEL — Rapportera innan du ändrar

För varje steg nedan:
1. Läs de relevanta filerna
2. Rapportera vad du hittat och vad du planerar göra
3. Vänta på godkännande
4. Implementera

---

## Steg 1 — Publik story-visare

**Mål:** `/story/[token]` ska visa en delad story som en fullskärms kortvisare.
Speglar Flutter-appens `StoryScreen` (se ~/Developer/vidder_flutter/lib/features/stories/).

### 1a — Kontrollera befintliga filer

Kolla om dessa filer redan finns:
- `src/app/(public)/story/[token]/page.tsx`
- `src/app/(public)/story/[token]/StoryViewer.tsx`
- `src/app/(public)/story/[token]/cards/IntroCard.tsx`
- `src/app/(public)/story/[token]/cards/PlaceCard.tsx`
- `src/app/(public)/story/[token]/cards/TransitionCard.tsx`
- `src/app/(public)/story/[token]/cards/OutroCard.tsx`
- `src/app/(public)/story/[token]/cards/DayCard.tsx`

Om de finns — läs dem och rapportera om de är kompletta eller behöver fixas.
Om de saknas — skapa dem enligt specifikationen nedan.

### 1b — Supabase RLS

Kontrollera om dessa RLS-policies finns i Supabase.
Om de saknas, instruera användaren att köra detta i Supabase SQL Editor:

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

### 1c — Specifikation för story-visaren

**page.tsx** (Server Component, ingen auth krävs):
- Ta emot `params.token`
- Validera token-format: `/^[A-Z0-9]{4,12}$/i`
- Hämta från Supabase: `stories` där `share_token = token` och `status = 'shared'`
- Hämta: `story_cards` där `story_id = story.id`, sorterat på `position`
- Hämta: `trips` där `id = story.trip_id`
- Hämta: `trip_points` där `trip_id = trip.id`
- Om story inte hittas: `notFound()`
- Rendera `<StoryViewer>` med all data

**StoryViewer.tsx** (Client Component):
- Fullskärms layout (`fixed inset-0 bg-black`)
- Horisontell kortnavigation med touch/swipe och piltangenter
- Progressbar längst upp (ett segment per kort, vitt = aktivt/passerat, 30% opacity = kommande)
- Stängknapp (top-left) — länk till vidder.app
- Tab-toggle (top-right): "Story" | "Karta" — visa bara om trip_points finns
- Dela-knapp: Web Share API om tillgängligt, annars kopiera URL

**Korttyper** (se story_service.dart för exakt data-struktur):

`IntroCard` — mörk (#0A0A2E) bakgrund:
- Mapbox Static Image (route_image_overlay eller points_image_overlay)
- Trip-namn, datum, antal platser, distans, transportemoji
- "Starta story →"-knapp

`PlaceCard` — fullskärmsfoto:
- thumbnail_url som bakgrundsbild
- Om ingen bild: kategori-bakgrundsfärg + emoji
- Gradient overlay nedtill
- Platsnamn, kategori-chip, datum, anteckning

`TransitionCard` — ljus design (vit bakgrund):
- Mapbox Static Image (map_image_overlay, light-v11)
- From/To-chips med A (blå #0009AB) och B (röd #DE2110) pins
- Distans

`OutroCard` — mörk (#0A0A2E) bakgrund:
- Mapbox Static Image (route eller points)
- "Resa avslutad"-label
- Statistikgrid: datum, distans, tid, antal platser
- "Klar"-knapp

`DayCard` — mörk bakgrund, centrerat:
- "Dag N" label
- Datum på svenska (måndag 14 juli)

**StoryMapTab** (MapLibre, visas i "Karta"-fliken):
- MapLibre GL med Mapbox tiles (NEXT_PUBLIC_MAPBOX_TOKEN)
- GPS-rutt som grön polylinje (#22C55E)
- Place-markörer (blå #0009AB)
- Auto-fit bounds

**Mapbox Static Images URL-format:**
```
https://api.mapbox.com/styles/v1/mapbox/{map_style}/static/{overlay}/auto/{map_size}?access_token={MAPBOX_TOKEN}&padding={map_padding}
```
Token hämtas från `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`.

### 1d — Varumärkesfärger

```
Primär blå:   #0009AB
Sekundär röd: #DE2110  
Mörk bakgrund: #0A0A2E  (intro/outro-kort)
Grön rutt:    #22C55E
Font:         Nunito
```

---

## Steg 2 — Admin platslista

**Mål:** `/app` ska visa användarens platser med karta och lista.
Kontrollera befintliga `src/app/app/PlacesList.tsx` och `MapView.tsx` — rapportera vad som redan fungerar.

### 2a — Kontrollera befintlig kod

Läs dessa filer och rapportera vad de gör:
- `src/app/app/page.tsx`
- `src/app/app/AppShell.tsx`
- `src/app/app/PlacesList.tsx`
- `src/app/app/MapView.tsx`
- `src/lib/user-places.ts`

### 2b — Vad som ska fungera

- Lista användarens `user_places` från Supabase
- Sök på titel
- Filter: kategori (viewpoint/food/nature/parking/camp/beach/photo/other)
- Filter: synlighet (private/shared/public)
- Platsdetalj: redigera titel, kategori, synlighet, anteckning
- Karta med markörer (privat=grön, delad=blå, publik=orange)

---

## Steg 3 — Admin resor

**Mål:** Visa användarens resor med story-indikator.

Läs `src/lib/trips.ts` och `src/app/app/TripsView.tsx` — rapportera vad som redan finns.

Vad som ska fungera:
- Lista användarens `trips` från Supabase
- Visa namn, datum, distans, transportemoji
- Story-indikator om story finns för resan
- Klicka på resa med story → öppna `/story/[share_token]`

---

## Steg 4 — Deploy till Vercel

När steg 1-3 fungerar lokalt:

```bash
git add -A
git commit -m "feat: story viewer + admin places + admin trips"
git push
```

Vercel deployas automatiskt.

Kontrollera att dessa miljövariabler finns i Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (eyJ-formatet)
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_APP_URL`

---

## Tekniska begränsningar att hålla koll på

- `@supabase/supabase-js` stöder inte `sb_publishable_`-nycklar — använd alltid `eyJ`-format
- MapLibre CSS måste importeras i `globals.css`, inte som dynamic import
- Alla card data-interfaces behöver `[key: string]: unknown` index-signatur
- Server Components kan inte använda hooks — håll Client Components separata
- `.env.local` ska aldrig committas till git

---

## Filstruktur — levererade filer från Sprint 0+1

Dessa filer är redan skapade och type-checkade (0 TypeScript-fel):

```
src/
├── middleware.ts
├── lib/
│   ├── types.ts                          ← komplett typsystem
│   └── supabase/
│       ├── server.ts
│       └── client.ts
└── app/
    ├── globals.css                        ← Vidder design tokens + MapLibre CSS
    ├── layout.tsx                         ← Nunito font
    ├── login/
    │   ├── page.tsx
    │   └── LoginForm.tsx
    ├── auth/callback/route.ts
    ├── (public)/
    │   ├── layout.tsx
    │   └── story/[token]/
    │       ├── page.tsx
    │       ├── StoryViewer.tsx
    │       ├── StoryProgressBar.tsx
    │       ├── StoryMapTab.tsx
    │       ├── storyUtils.ts
    │       ├── metadata.ts
    │       └── cards/
    │           ├── IntroCard.tsx
    │           ├── PlaceCard.tsx
    │           ├── TransitionCard.tsx
    │           ├── OutroCard.tsx
    │           └── DayCard.tsx
    └── (admin)/
        ├── layout.tsx
        ├── AdminNav.tsx
        └── admin/page.tsx
```

Dessa filer ska integreras med det befintliga projektet utan att förstöra
det som redan fungerar i `src/app/app/`.
