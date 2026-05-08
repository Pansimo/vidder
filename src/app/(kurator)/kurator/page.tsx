import { createClient } from '@/lib/supabase/server'

export default async function KuratorDashboard() {
  const supabase = await createClient()
  const { count: courseCount } = await supabase
    .from('orienteering_courses')
    .select('*', { count: 'exact', head: true })
  const { count: stampCount } = await supabase
    .from('control_stamps')
    .select('*', { count: 'exact', head: true })
  const { count: areaCount } = await supabase
    .from('curated_areas')
    .select('*', { count: 'exact', head: true })
  const { count: poiCount } = await supabase
    .from('curated_pois')
    .select('*', { count: 'exact', head: true })
  const { count: poiPublished } = await supabase
    .from('curated_pois')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-medium">Dashboard</h1>

      <p className="mb-3 text-xs font-medium uppercase text-gray-500">Orientering</p>
      <div className="mb-6 grid max-w-lg grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">Banor</p>
          <p className="mt-1 text-3xl font-medium">{courseCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">Stämplar totalt</p>
          <p className="mt-1 text-3xl font-medium">{stampCount ?? 0}</p>
        </div>
      </div>

      <p className="mb-3 text-xs font-medium uppercase text-gray-500">Curated POI</p>
      <div className="mb-6 grid max-w-lg grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">Områden</p>
          <p className="mt-1 text-3xl font-medium">{areaCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">POI:er</p>
          <p className="mt-1 text-3xl font-medium">{poiCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">Publicerade POI:er</p>
          <p className="mt-1 text-3xl font-medium">{poiPublished ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
