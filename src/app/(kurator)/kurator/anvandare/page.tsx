import { createClient } from '@/lib/supabase/server'
import { updateUserFlag } from './actions'

export default async function AnvandarePage() {
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

  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, is_curator, is_premium, is_admin, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Användare</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3">Skapad</th>
              <th className="px-4 py-3">Premium</th>
              <th className="px-4 py-3">Kurator</th>
              <th className="px-4 py-3">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((u) => {
              const initials = [u.first_name?.[0], u.last_name?.[0]]
                .filter(Boolean)
                .join('')
                .toUpperCase() || '?'
              const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Namnlös'
              const created = u.created_at
                ? new Date(u.created_at).toLocaleDateString('sv-SE')
                : '—'

              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        {initials}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{fullName}</p>
                        {u.username && (
                          <p className="text-xs text-gray-400">@{u.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{created}</td>
                  <td className="px-4 py-3">
                    <ToggleFlag userId={u.id} flag="is_premium" value={!!u.is_premium} />
                  </td>
                  <td className="px-4 py-3">
                    <ToggleFlag userId={u.id} flag="is_curator" value={!!u.is_curator} />
                  </td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        Admin
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Inga användare hittades.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ToggleFlag({
  userId,
  flag,
  value,
}: {
  userId: string
  flag: 'is_premium' | 'is_curator'
  value: boolean
}) {
  async function toggle() {
    'use server'
    await updateUserFlag(userId, flag, !value)
  }

  return (
    <form action={toggle}>
      <button
        type="submit"
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          value ? 'bg-green-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </form>
  )
}
