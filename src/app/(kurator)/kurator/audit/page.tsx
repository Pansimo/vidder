import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/kurator')

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Audit log</h1>
      <p className="text-gray-400">Inga händelser ännu.</p>
    </div>
  )
}
