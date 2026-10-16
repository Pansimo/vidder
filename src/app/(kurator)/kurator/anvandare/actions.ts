'use server'

import { createClient } from '@/lib/supabase/server'
import { getMyProfile } from '@/lib/supabase/profile'
import { revalidatePath } from 'next/cache'

export async function updateUserFlag(
  userId: string,
  flag: 'is_premium' | 'is_curator',
  value: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const profile = await getMyProfile(supabase)

  if (!profile?.is_admin) throw new Error('unauthorized')

  // v124: flaggan sätts via set_profile_flag (SECURITY DEFINER, kräver
  // is_admin hos anroparen). Den gamla direkta UPDATE:n nådde aldrig en
  // annan användares rad under RLS (F-WEB-ADMIN-FLAG-RPC) och tystnade.
  const { error } = await supabase.rpc('set_profile_flag', {
    p_user: userId,
    p_flag: flag,
    p_value: value,
  })
  if (error) {
    console.error('[updateUserFlag]', error.code, error.message)
    throw new Error(error.message)
  }

  revalidatePath('/kurator/anvandare')
}
