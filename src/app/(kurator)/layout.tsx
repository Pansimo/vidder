import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KuratorSidebar from './KuratorSidebar'

export default async function KuratorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_curator, is_admin, first_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_curator) redirect('/app')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <KuratorSidebar firstName={profile.first_name} isAdmin={profile.is_admin} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
