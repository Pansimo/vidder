import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Utloggning på webben — bara DEN HÄR webbläsarens session (scope local).
 *
 * S1 block 3 (Ulf-beslut 2026-10-19): supabase-js har `global` som
 * standard, vilket avslutade även telefonernas sessioner (F-SIGNOUT-GLOBAL-
 * SCOPE: utloggning på webben 2026-10-18 → refresh_token_not_found på båda
 * telefonerna). "Logga ut överallt" blir ett eget val efter beta
 * (F-SIGNOUT-EVERYWHERE). Alla utloggningar går genom den här funktionen;
 * `scripts/check-sign-out-scope.mjs` (prebuild) fäller bygget annars.
 */
export async function signOutThisDevice(supabase: SupabaseClient) {
  return supabase.auth.signOut({ scope: "local" });
}
