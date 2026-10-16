import { createClient } from '@/lib/supabase/server'
import { getMyProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import KuratorSidebar from './KuratorSidebar'

export default async function KuratorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getMyProfile(supabase)

  if (!profile?.is_curator) redirect('/app')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <KuratorSidebar firstName={profile.first_name} isAdmin={profile.is_admin} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
