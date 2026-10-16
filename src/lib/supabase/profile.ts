import type { createClient } from './server'

type Client = Awaited<ReturnType<typeof createClient>>

/**
 * Egen profilrad med flaggor (v119b, F-SECURITY-AUDIT paket 1b).
 *
 * Efter v119b får inloggade bara läsa sex kolumner direkt ur `profiles`
 * (id, display_name, username, first_name, last_name, avatar_url) — flaggor
 * och övriga fält i den EGNA raden läses via RPC:n `get_my_profile()`
 * (SECURITY DEFINER, v121). Fungerar både före och efter v119b.
 *
 * Fel (nät, RPC) → null; anroparen behandlar det som "ingen behörighet",
 * precis som en saknad rad förut.
 */
export type MyProfile = {
  id: string
  display_name: string | null
  username: string | null
  first_name: string | null
  last_name: string | null
  city: string | null
  bio: string | null
  country: string | null
  profile_visibility: string | null
  avatar_url: string | null
  is_curator: boolean
  is_premium: boolean
  is_admin: boolean
  created_at: string
}

export async function getMyProfile(supabase: Client): Promise<MyProfile | null> {
  const { data, error } = await supabase.rpc('get_my_profile')
  if (error) {
    console.error('[getMyProfile]', error.code, error.message)
    return null
  }
  const rows = (data ?? []) as MyProfile[]
  return rows[0] ?? null
}

/**
 * Alla profiler med flaggor — bara för admin (v124 `list_profiles_admin()`,
 * SECURITY DEFINER, nekar 42501 för icke-admin). Fel → [] (sidorna är
 * redan admin-spärrade via getMyProfile).
 */
export type AdminProfile = {
  id: string
  display_name: string | null
  username: string | null
  first_name: string | null
  last_name: string | null
  is_curator: boolean
  is_premium: boolean
  is_admin: boolean
  created_at: string
}

export async function listProfilesAdmin(supabase: Client): Promise<AdminProfile[]> {
  const { data, error } = await supabase.rpc('list_profiles_admin')
  if (error) {
    console.error('[listProfilesAdmin]', error.code, error.message)
    return []
  }
  return (data ?? []) as AdminProfile[]
}
