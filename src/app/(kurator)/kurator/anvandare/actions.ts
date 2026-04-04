'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserFlag(
  userId: string,
  flag: 'is_premium' | 'is_curator',
  value: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('unauthorized')

  await supabase
    .from('profiles')
    .update({ [flag]: value })
    .eq('id', userId)

  revalidatePath('/kurator/anvandare')
}
