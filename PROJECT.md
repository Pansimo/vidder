# Vidder

## Vision

Vidder är en reseapp där användare kan fånga, spara, organisera och dela
platser de upptäcker under resor.

Appen fokuserar på spontana upptäckter snarare än planerad turism.

Målet är att göra det möjligt att spara en plats på några sekunder ---
även utan internetuppkoppling.

Vidder fungerar som en personlig upptäcktsdagbok kopplad till en karta.

------------------------------------------------------------------------

## Vad Vidder är

Vidder är:

-   en personlig platsdagbok
-   ett verktyg för spontana upptäckter
-   en kartbaserad minnesbank
-   ett reseverktyg för verkliga upplevelser

Exempel på platser:

-   utsiktsplatser\
-   badplatser\
-   ställplatser\
-   caféer\
-   naturupplevelser\
-   dolda pärlor

------------------------------------------------------------------------

## Vad Vidder INTE är

Vidder är inte:

-   en reseplaneringsapp
-   en bokningsplattform
-   ett socialt media i första versionen
-   en turistguide med färdiga destinationer

Fokus ligger på användarens egna upptäckter.

------------------------------------------------------------------------

## Målgrupp

-   Husbilsresenärer
-   Bilresenärer
-   Friluftsintresserade
-   Vandrare
-   Roadtrip-resenärer
-   Personer som spontant upptäcker platser

------------------------------------------------------------------------

## Kärnprincip

**Spara först --- redigera senare**

En plats ska kunna sparas på högst 2 sekunder.

Ingen information ska krävas vid sparande.

------------------------------------------------------------------------

## Capture Flow

1.  App öppnas
2.  Kartan visas direkt
3.  Användaren trycker **Spara plats**
4.  Platsen sparas omedelbart med:
    -   GPS-position
    -   tidpunkt
    -   användare

Redigering sker efteråt.

------------------------------------------------------------------------

## Startupplevelse

Vidder öppnar alltid i kartvyn.

Prioriteringsordning:

1.  Senast använda kartposition
2.  Användarens aktuella position
3.  Standardvy (första start)

Användarens sparade platser visas direkt.

Kartan är appens primära gränssnitt.

------------------------------------------------------------------------

## Navigation

Bottennavigation med tre huvudsektioner:

1.  **Karta** -- huvudvy och startskärm\
2.  **Spara** -- snabb registrering av plats\
3.  **Mina platser** -- användarens sparade upptäckter

En flytande **➕ Spara plats**-knapp finns alltid på kartan.

------------------------------------------------------------------------

## Kartan som huvudvy

Kartan är appens centrala gränssnitt.

Användaren ska kunna:

-   se sin position
-   se sparade platser
-   zooma och panorera
-   öppna platsdetaljer
-   skapa ny plats direkt från kartan

------------------------------------------------------------------------

## Vad är en plats (POI)

En plats i Vidder representerar en **personlig upptäckt**, inte en
global destination.

Flera användare kan spara samma geografiska plats som separata
upptäckter.

------------------------------------------------------------------------

## Geografisk modell

Alla platser lagras som geografiska punkter.

Platser kan kompletteras med:

-   location_type
-   radius (område)
-   bearing (riktning)

### location_type

-   point
-   area
-   viewpoint
-   parking
-   camp
-   nature
-   other

------------------------------------------------------------------------

## Social modell

Vidder är initialt privat.

Synlighetsnivå per plats:

-   Privat
-   Delad
-   Publik

Standard: Privat.

Social funktionalitet introduceras gradvis.

------------------------------------------------------------------------

## Offline-strategi

Vidder ska fungera utan internet.

Användaren ska kunna:

-   öppna appen
-   se sparade platser
-   spara nya platser
-   ta bilder
-   skriva anteckningar

Data synkroniseras automatiskt när uppkoppling finns.

Servern är inte enda sanningen --- lokal lagring används alltid.

------------------------------------------------------------------------

## Plattform

Vidder byggs initialt som:

**Progressive Web App (PWA)**

Mål:

-   iPhone
-   Android
-   Webbläsare

Samma kodbas ska senare kunna paketeras som mobilapp.

------------------------------------------------------------------------

## Teknisk arkitektur

Frontend: - Next.js - TypeScript - Tailwind CSS

Backend: - Supabase - PostgreSQL - Supabase Auth - Supabase Storage

Hosting: - Vercel

Karta: - Mapbox eller MapLibre

Offline: - Lokal databas (IndexedDB) - Sync queue

------------------------------------------------------------------------

## Designprinciper

-   Mobile first
-   Minimal friktion
-   Snabb registrering
-   Natur- och resekänsla
-   Offlinevänlig
-   Kartcentrerad upplevelse

------------------------------------------------------------------------

## MVP-funktioner

1.  Inloggning
2.  Interaktiv karta
3.  Spara plats
4.  Bilduppladdning
5.  Anteckningar & taggar
6.  Lista över egna platser
7.  Automatisk synkronisering

------------------------------------------------------------------------

## Utökade funktioner (Version 1.x)

-   Offline-sync förbättring
-   Ruttloggning
-   Samlingar
-   Filter & sök

------------------------------------------------------------------------

## Framtida funktioner

-   Community-platser
-   Följ användare
-   Betyg & kommentarer
-   AI-genererade reseanteckningar
-   Rekommendationssystem
