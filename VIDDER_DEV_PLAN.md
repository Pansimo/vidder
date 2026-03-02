# VIDDER_DEV_PLAN.md

## Syfte

Denna plan beskriver utvecklingsordningen för Vidder MVP. Målet är att
snabbt nå en fungerande version som kan användas i verkliga resor.

Princip: **Bygg användbart först -- perfekt senare.**

------------------------------------------------------------------------

## Fas 1 -- Projektgrund

### Mål

Projektet startar och kör lokalt.

### Uppgifter

-   Initiera Next.js + TypeScript
-   Installera Tailwind CSS
-   Grundläggande projektstruktur
-   Setup Git repository
-   Deploy första tomma version till Vercel

### Resultat

-   App kör på localhost
-   App deployad online

------------------------------------------------------------------------

## Fas 2 -- Autentisering

### Mål

Användare kan logga in.

### Uppgifter

-   Skapa Supabase-projekt
-   Koppla Supabase till app
-   Implementera login
-   Implementera logout
-   Skapa profiles-tabell

### Resultat

-   Inloggning fungerar
-   Användarsession sparas

------------------------------------------------------------------------

## Fas 3 -- Kartan

### Mål

Kartan är appens huvudvy.

### Uppgifter

-   Installera kartbibliotek
-   Visa användarens position
-   Zoom & pan
-   Startvy = karta
-   Bottom navigation

### Resultat

-   App öppnar direkt i karta

------------------------------------------------------------------------

## Fas 4 -- Spara plats

### Mål

Core feature fungerar.

### Uppgifter

-   ➕ Spara plats-knapp
-   Hämta GPS-position
-   Skapa POI lokalt
-   Visa markör direkt

### Resultat

-   Plats sparas på \< 2 sekunder

------------------------------------------------------------------------

## Fas 5 -- Supabase lagring

### Mål

Platser sparas permanent.

### Uppgifter

-   pois-tabell
-   RLS policies
-   Skicka POI till Supabase
-   Hämta användarens POIs

### Resultat

-   Platser laddas vid omstart

------------------------------------------------------------------------

## Fas 6 -- Offline stöd

### Mål

Appen fungerar utan internet.

### Uppgifter

-   Lokal lagring (IndexedDB)
-   sync_status
-   Sync queue
-   Auto sync vid online

### Resultat

-   Platser sparas offline

------------------------------------------------------------------------

## Fas 7 -- Mina platser

### Mål

Personlig översikt.

### Uppgifter

-   Lista över POIs
-   Enkel filtrering
-   Öppna detaljvy

### Resultat

-   Användaren ser sitt researkiv

------------------------------------------------------------------------

## Fas 8 -- Bilder & anteckningar

### Mål

Platser får innehåll.

### Uppgifter

-   Bilduppladdning
-   Supabase Storage
-   Anteckningar
-   Redigering av plats

### Resultat

-   Komplett MVP

------------------------------------------------------------------------

## MVP Definition

Vidder MVP är klar när användaren kan:

-   logga in
-   se karta
-   spara plats
-   använda app offline
-   se sina platser
-   lägga till bild & anteckning

------------------------------------------------------------------------

## Efter MVP

Prioriterade nästa steg:

1.  Sync-förbättring
2.  Taggar & filter
3.  Samlingar
4.  Publika platser
5.  Community

------------------------------------------------------------------------

## Viktig regel

Bygg alltid i denna ordning:

1.  Fungerar
2.  Snabbt
3.  Snyggt

Inte tvärtom.
