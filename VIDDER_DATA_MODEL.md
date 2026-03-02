# VIDDER_DATA_MODEL.md

## Syfte

Detta dokument definierar databasschemat för Vidder MVP. Modellen är
byggd för: - offline-first - personlig upptäcktsmodell - framtida social
funktionalitet

------------------------------------------------------------------------

## Tabell: profiles

Kopplas till Supabase auth.users

  fält           typ         beskrivning
  -------------- ----------- ----------------
  id             uuid (PK)   användarens id
  display_name   text        visningsnamn
  created_at     timestamp   skapad

------------------------------------------------------------------------

## Tabell: pois

Representerar en personlig upptäckt.

  fält            typ                beskrivning
  --------------- ------------------ -----------------------
  id              uuid (PK)          plats-id
  user_id         uuid               ägare
  title           text               titel
  note            text               anteckning
  lat             double precision   latitud
  lng             double precision   longitud
  location_type   text               typ av plats
  radius_m        integer            område
  bearing_deg     integer            riktning
  visibility      text               private/shared/public
  visited_at      timestamp          besökstid
  created_at      timestamp          skapad
  updated_at      timestamp          uppdaterad

------------------------------------------------------------------------

## Tabell: poi_images

Bilder kopplade till plats.

  fält           typ         beskrivning
  -------------- ----------- -------------
  id             uuid (PK)   bild-id
  poi_id         uuid        koppling
  user_id        uuid        ägare
  storage_path   text        filplats
  created_at     timestamp   skapad

------------------------------------------------------------------------

## Offlinefält (klientsida)

Lokalt lagrade fält:

  fält             beskrivning
  ---------------- -----------------------
  local_id         temporärt id
  sync_status      pending/synced/failed
  last_synced_at   senaste sync

------------------------------------------------------------------------

## Relationer

profiles (1) → pois (many)

pois (1) → poi_images (many)

------------------------------------------------------------------------

## Index (rekommenderat)

-   index på user_id
-   geo-index på lat/lng
-   index på created_at

------------------------------------------------------------------------

## RLS Principer

### pois

-   användare får läsa sina egna
-   användare får skriva sina egna

### poi_images

-   endast ägare får läsa/skriva

Publika platser implementeras senare.

------------------------------------------------------------------------

## Framtida utökningar

-   tags-tabell
-   collections
-   followers
-   comments
-   ratings

------------------------------------------------------------------------

## Viktig designregel

En plats är alltid en användares upptäckt. Ingen global platsdatabas
används i MVP.
