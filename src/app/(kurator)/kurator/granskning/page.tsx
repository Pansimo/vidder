import { createClient } from '@/lib/supabase/server'
import { approveControl, rejectControl } from './actions'

export default async function GranskningPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!callerProfile?.is_admin) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center p-6">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-xl font-medium">Ingen behörighet</h1>
        <p className="text-sm text-gray-500">
          Den här sidan kräver admin-behörighet.
          Kontakta Vidder om du behöver åtkomst.
        </p>
      </div>
    )
  }

  const { data: pending } = await supabase
    .from('orienteering_controls')
    .select('*, orienteering_courses!orienteering_controls_course_id_fkey(name, creator_id)')
    .eq('difficulty', 'expert')
    .eq('approved', false)
    .order('created_at', { ascending: true })

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Granskning</h1>
      <p className="mb-4 text-sm text-gray-500">
        Expert-kontroller som behöver godkännas innan publicering.
      </p>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Kontrollnamn</th>
              <th className="px-4 py-3">Bana</th>
              <th className="px-4 py-3">Beskrivning</th>
              <th className="px-4 py-3">Skapad</th>
              <th className="px-4 py-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pending?.map((ctrl) => {
              const courseName =
                (ctrl.orienteering_courses as { name: string } | null)?.name ?? '—'
              const created = ctrl.created_at
                ? new Date(ctrl.created_at).toLocaleDateString('sv-SE')
                : '—'

              return (
                <tr key={ctrl.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {ctrl.name || 'Namnlös'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{courseName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {ctrl.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{created}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <ApproveButton controlId={ctrl.id} />
                      <RejectButton controlId={ctrl.id} />
                    </div>
                  </td>
                </tr>
              )
            })}
            {(!pending || pending.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Inga kontroller att granska.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ApproveButton({ controlId }: { controlId: string }) {
  async function handle() {
    'use server'
    await approveControl(controlId)
  }

  return (
    <form action={handle}>
      <button
        type="submit"
        className="btn-primary rounded-md px-3 py-1 text-xs font-medium"
      >
        Godkänn
      </button>
    </form>
  )
}

function RejectButton({ controlId }: { controlId: string }) {
  async function handle() {
    'use server'
    await rejectControl(controlId)
  }

  return (
    <form action={handle}>
      <button
        type="submit"
        className="btn-danger rounded-md px-3 py-1 text-xs font-medium"
      >
        Avvisa
      </button>
    </form>
  )
}
