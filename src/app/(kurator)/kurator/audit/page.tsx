import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuditFilters from './AuditFilters'
import AuditDiffRow from './AuditDiffRow'
import SortableHeader from '../../_components/SortableHeader'

const PAGE_SIZE = 20

const OP_LABELS: Record<string, string> = {
  insert: 'Skapad',
  update: 'Uppdaterad',
  delete: 'Raderad',
}

const OP_COLORS: Record<string, string> = {
  insert: 'text-green-600',
  update: 'text-blue-600',
  delete: 'text-red-600',
}

const TABLE_LABELS: Record<string, string> = {
  curated_areas: 'areas',
  curated_pois: 'pois',
  curated_collections: 'collections',
  curated_poi_collections: 'poi_collections',
}

interface Props {
  searchParams: Promise<{
    table?: string
    op?: string
    user?: string
    period?: string
    q?: string
    page?: string
    sort?: string
    dir?: string
  }>
}

export default async function AuditPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  // Admin gate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/kurator')

  // Fetch curators for filter dropdown
  const { data: curators } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('is_curator', true)
    .order('display_name')

  // Build query
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('curated_audit_log')
    .select('*', { count: 'exact' })

  if (params.table && params.table !== 'all') {
    query = query.eq('table_name', params.table)
  }
  if (params.op && params.op !== 'all') {
    query = query.eq('operation', params.op)
  }
  if (params.user && params.user !== 'all') {
    query = query.eq('changed_by', params.user)
  }
  if (params.q) {
    query = query.ilike('record_id', `%${params.q}%`)
  }
  if (params.period && params.period !== 'all') {
    const now = new Date()
    let since: Date
    if (params.period === '24h') since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    else if (params.period === '7d') since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    else since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    query = query.gte('changed_at', since.toISOString())
  }

  // Sorting
  const sortCol = params.sort ?? 'changed_at'
  const sortDir = params.dir ?? 'desc'
  const sortMap: Record<string, string> = {
    time: 'changed_at',
    table: 'table_name',
    user: 'changed_by',
    changed_at: 'changed_at',
  }
  const dbCol = sortMap[sortCol] ?? 'changed_at'
  query = query.order(dbCol, { ascending: sortDir === 'asc' })
    .range(offset, offset + PAGE_SIZE - 1)

  const { data: entries, count: totalCount } = await query

  // Resolve user names
  const userMap: Record<string, string> = {}
  for (const c of curators ?? []) {
    userMap[c.id] = c.display_name ?? c.id.slice(0, 8)
  }

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE)

  // Build link to resource
  function resourceLink(tableName: string, recordId: string): string | null {
    if (tableName === 'curated_areas') return `/kurator/omraden/${recordId}`
    if (tableName === 'curated_pois') return `/kurator/poi`
    return null
  }

  function formatTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleString('sv-SE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // Build pagination URL
  function pageUrl(p: number): string {
    const next = new URLSearchParams()
    if (params.table && params.table !== 'all') next.set('table', params.table)
    if (params.op && params.op !== 'all') next.set('op', params.op)
    if (params.user && params.user !== 'all') next.set('user', params.user)
    if (params.period && params.period !== 'all') next.set('period', params.period)
    if (params.q) next.set('q', params.q)
    if (params.sort) next.set('sort', params.sort)
    if (params.dir) next.set('dir', params.dir)
    if (p > 1) next.set('page', String(p))
    const qs = next.toString()
    return qs ? `/kurator/audit?${qs}` : '/kurator/audit'
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Audit log</h1>

      <AuditFilters curators={curators ?? []} />

      <p className="mb-3 text-sm text-gray-500">
        {totalCount ?? 0} händelser
        {totalPages > 1 && <span> · Sida {page} av {totalPages}</span>}
      </p>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <SortableHeader column="time" label="Tid" />
              <SortableHeader column="user" label="Användare" />
              <SortableHeader column="table" label="Tabell" />
              <th className="px-4 py-3">Åtgärd</th>
              <th className="px-4 py-3">Post</th>
              <th className="px-4 py-3">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries?.map(entry => {
              const link = resourceLink(entry.table_name, entry.record_id)
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">
                    {formatTime(entry.changed_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {entry.changed_by ? (userMap[entry.changed_by] ?? '(borttagen användare)') : '(systemet)'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {TABLE_LABELS[entry.table_name] ?? entry.table_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={OP_COLORS[entry.operation] ?? ''}>
                      {OP_LABELS[entry.operation] ?? entry.operation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {link ? (
                      <Link href={link} className="hover:underline" style={{ color: 'var(--color-primary)' }}>
                        {entry.record_id}
                      </Link>
                    ) : (
                      entry.record_id
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AuditDiffRow
                      diff={entry.diff as { before?: Record<string, unknown>; after?: Record<string, unknown> } | null}
                      operation={entry.operation}
                    />
                  </td>
                </tr>
              )
            })}
            {(!entries || entries.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Inga händelser matchar filtret.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div>
            {page > 1 && (
              <Link href={pageUrl(page - 1)} className="btn-secondary rounded-md px-3 py-1.5 text-sm font-medium">
                Föregående
              </Link>
            )}
          </div>
          <div>
            {page < totalPages && (
              <Link href={pageUrl(page + 1)} className="btn-secondary rounded-md px-3 py-1.5 text-sm font-medium">
                Nästa
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
