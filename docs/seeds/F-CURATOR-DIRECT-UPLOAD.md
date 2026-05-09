# F-CURATOR-DIRECT-UPLOAD

Direkt klient-side Supabase Storage upload for bilder.

## Bakgrund

Server Action-fallback fungerar men har tva begransningar:
- **4 MB Vercel body limit** pa Server Actions
- **Extra natverkshopp** (browser -> Vercel -> Supabase istallet for browser -> Supabase direkt)

## Problem

Klient-side direkt-upload mot Supabase Storage ska fungera enligt Supabase-design men gjorde det inte under C2-utvecklingen. Symptom: `new row violates row-level security policy` (403) trots:

- Korrekt JWT med `role: authenticated` och giltig `user_id`
- `is_curator()` returnerar `true` for anvandaren i andra kontexter
- Permissiva RLS-policies pa `storage.objects` (aven helt oppen `WITH CHECK (true) TO public`)
- Bucket `curated-images` ar `public = true`, inga size/mime-restriktioner
- Inga RESTRICTIVE policies hittades i `pg_policies`-diagnostik
- Bade `createBrowserClient` (klient) och `createServerClient` (server) failade

## Nuvarande losning

Server Action (`_components/upload-action.ts`) som:
1. Verifierar auth + `is_curator` via normal klient
2. Konverterar `File` till `Buffer` via `arrayBuffer()`
3. Laddar upp med `service_role`-klient (bypasses RLS)

## Utredningsspar

- Analysera om Supabase storage engine gor interna operationer (SELECT, UPDATE) utover INSERT vid upload
- Testa med signed upload URLs (server action genererar URL, klient laddar upp direkt)
- Kontrollera om `@supabase/ssr` cookie-hantering paverkar storage-anrop annorlunda an tabell-anrop
- Undersok om det finns dolda triggers eller interna policies i Supabase storage-schemat
- Testa med minimal reproduktion i nytt projekt

## Prioritet

Lag. Nuvarande losning fungerar for typiska hero-bilder (< 1 MB). Blir aktuellt om storre filer behover laddas upp.
