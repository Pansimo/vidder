# FIXES.md — Vidder Web

## fix: add RouteCard, PhotoCard, TextCard, SubHeaderCard renderers
**Fil:** `src/app/(public)/s/[token]/cards/RouteCard.tsx`, `PhotoCard.tsx`, `TextCard.tsx`, `SubHeaderCard.tsx`, `StoryViewer.tsx`, `src/lib/types.ts`
**Problem:** Fyra korttyper (route, photo, text, sub_header) saknade renderare — `renderCard` returnerade `null` → svarta/osynliga kort i story-viewern.
**Fix:** Byggde fyra nya card-komponenter, kopplade in i renderCard-switchen. Default-fallback ändrad från `return null` till ljus (#F0F2F5) degraderingskort som visar korttyp + titel — okända framtida korttyper blir aldrig svarta igen.

## fix: deduplicate get_shared_story RPC with React cache()
**Fil:** `src/app/(public)/s/[token]/page.tsx`
**Problem:** `generateMetadata` och `StoryPage` anropade `supabase.rpc('get_shared_story')` var för sig → dubbla databas-roundtrips per sidladdning.
**Fix:** Wrappade RPC-anropet i `React.cache()` via `fetchSharedStory(token)`. Båda funktionerna delar nu ett enda anrop per request. Lade även till `isValidToken()` som accepterar kortkoder (^[A-Z0-9]{4,12}$) och legacy-UUID:er.

## feat: canonical /s/[token] route with /story/[token] redirect
**Fil:** `src/app/(public)/s/[token]/` (ny kanonisk route), `src/app/(public)/story/[token]/page.tsx` (redirect), `src/app/app/TripsView.tsx`
**Problem:** Länkkontraktet DELNING-002 v2.1 §7.1 kräver kanonisk URL `/s/{token}` med legacy-redirect från `/story/{token}`.
**Fix:** Flyttade hela story-viewern till `/s/[token]/`. `/story/[token]` returnerar nu 308 permanent redirect till `/s/[token]`. Intern länk i TripsView uppdaterad.

## fix: remove encodeURIComponent from RouteCard path overlay
**Fil:** `src/app/(public)/s/[token]/cards/RouteCard.tsx`
**Problem:** `encodeURIComponent` konverterade kommatecken till `%2C` i path-overlayen, vilket fick Mapbox att misstolka råa koordinater som encoded polyline → rutten ritades vid Arabiska halvön istället för Stockholm.
**Fix:** Tog bort `encodeURIComponent`. (Ersattes sedan helt av encoded polyline i nästa commit.)

## fix: use Google Encoded Polyline for RouteCard path overlay
**Fil:** `src/app/(public)/s/[token]/cards/RouteCard.tsx`
**Problem:** Mapbox Static Images API stöder inte råa koordinatpar i path-overlay — kräver Google Encoded Polyline (precision 5). Råa siffror tolkades som polyline-tecken → garbage-koordinater.
**Fix:** Implementerade samma `encodePolyline`-algoritm som Flutter (`mapbox_static.dart:_encodePolyline`) + `encodeURIComponent` av resultatet. Verifierad roundtrip med Stockholm-koordinater.

## fix: reduce RouteCard path stroke from 4px to 2px
**Fil:** `src/app/(public)/s/[token]/cards/RouteCard.tsx`
**Problem:** Stroke-bredd 4px på @2x-bild renderades som 8 fysiska pixlar — "tuschpenna"-effekt.
**Fix:** Minskade stroke till 2px (4 fysiska pixlar), höjde opacity 0.7→0.8 för kompensation. Ren, tunn ruttlinje.
