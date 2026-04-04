import { createClient } from '@/lib/supabase/server'

export default async function KuratorDashboard() {
  const supabase = await createClient()
  const { count: courseCount } = await supabase
    .from('orienteering_courses')
    .select('*', { count: 'exact', head: true })
  const { count: stampCount } = await supabase
    .from('control_stamps')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-medium">Dashboard</h1>
      <div className="grid max-w-lg grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">Banor</p>
          <p className="mt-1 text-3xl font-medium">{courseCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">Stämplar totalt</p>
          <p className="mt-1 text-3xl font-medium">{stampCount ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
