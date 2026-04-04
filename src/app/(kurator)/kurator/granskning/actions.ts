'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('unauthorized')
  return supabase
}

export async function approveControl(controlId: string) {
  const supabase = await requireAdmin()

  await supabase
    .from('orienteering_controls')
    .update({ approved: true })
    .eq('id', controlId)

  revalidatePath('/kurator/granskning')
}

export async function rejectControl(controlId: string) {
  const supabase = await requireAdmin()

  await supabase
    .from('orienteering_controls')
    .delete()
    .eq('id', controlId)

  revalidatePath('/kurator/granskning')
}
