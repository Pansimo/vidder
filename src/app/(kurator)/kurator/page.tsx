import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function KuratorDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  const isAdmin = profile?.is_admin ?? false

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

  // Recent audit entries (admin only)
  let recentAudit: { id: string; changed_at: string; changed_by: string | null; table_name: string; operation: string; record_id: string }[] = []
  let userMap: Record<string, string> = {}

  if (isAdmin) {
    const { data, error: auditError } = await supabase
      .from('curated_audit_log')
      .select('id, changed_at, changed_by, table_name, operation, record_id')
      .order('changed_at', { ascending: false })
      .limit(5)

    if (auditError) {
      console.log('[Dashboard] Audit query error:', auditError.message)
    }
    recentAudit = data ?? []

    const { data: curators } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('is_curator', true)

    for (const c of curators ?? []) {
      userMap[c.id] = c.display_name ?? c.id.slice(0, 8)
    }
  }

  const opLabels: Record<string, string> = { insert: 'Skapad', update: 'Uppdaterad', delete: 'Raderad' }
  const opColors: Record<string, string> = { insert: 'text-green-600', update: 'text-blue-600', delete: 'text-red-600' }
  const tableLabels: Record<string, string> = { curated_areas: 'areas', curated_pois: 'pois', curated_collections: 'collections', curated_poi_collections: 'poi_collections' }

  function formatTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleString('sv-SE', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

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

      {isAdmin && (
        <>
          <p className="mb-3 text-xs font-medium uppercase text-gray-500">Senaste ändringar</p>
          <div className="mb-6 max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Tid</th>
                  <th className="px-4 py-2">Användare</th>
                  <th className="px-4 py-2">Tabell</th>
                  <th className="px-4 py-2">Åtgärd</th>
                  <th className="px-4 py-2">Post</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAudit.length > 0 ? recentAudit.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs font-mono text-gray-500">{formatTime(entry.changed_at)}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {entry.changed_by ? (userMap[entry.changed_by] ?? '(borttagen)') : '(systemet)'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{tableLabels[entry.table_name] ?? entry.table_name}</td>
                    <td className="px-4 py-2">
                      <span className={opColors[entry.operation] ?? ''}>{opLabels[entry.operation] ?? entry.operation}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{entry.record_id}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400 text-xs">Inga händelser ännu.</td></tr>
                )}
              </tbody>
            </table>
            <div className="border-t border-gray-100 px-4 py-2">
              <Link href="/kurator/audit" className="text-sm font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                Visa alla
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
