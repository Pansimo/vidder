import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RedigeraKursPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('orienteering_courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: controls } = await supabase
    .from('orienteering_controls')
    .select('id, name')
    .eq('course_id', id)

  const controlCount = controls?.length ?? 0
  const allNamed = controls?.every((c) => c.name && c.name.trim() !== '') ?? false

  const canPublish = course.name.trim() !== '' && controlCount >= 2 && allNamed

  async function updateCourse(formData: FormData) {
    'use server'
    const supabase2 = (await import('@/lib/supabase/server')).createClient()
    const sb = await supabase2
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    const access = formData.get('access') as string
    const requires_premium = access === 'premium'

    await sb
      .from('orienteering_courses')
      .update({
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        course_type: formData.get('course_type') as string,
        active_from: (formData.get('active_from') as string) || null,
        active_to: (formData.get('active_to') as string) || null,
        requires_premium,
      })
      .eq('id', id)

    revalidatePath(`/kurator/kurser/${id}`)
    redirect(`/kurator/kurser/${id}`)
  }

  async function publishCourse() {
    'use server'
    const supabase2 = (await import('@/lib/supabase/server')).createClient()
    const sb = await supabase2
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    await sb
      .from('orienteering_courses')
      .update({ is_public: true })
      .eq('id', id)

    revalidatePath(`/kurator/kurser/${id}`)
    redirect(`/kurator/kurser/${id}`)
  }

  async function unpublishCourse() {
    'use server'
    const supabase2 = (await import('@/lib/supabase/server')).createClient()
    const sb = await supabase2
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    await sb
      .from('orienteering_courses')
      .update({ is_public: false })
      .eq('id', id)

    revalidatePath(`/kurator/kurser/${id}`)
    redirect(`/kurator/kurser/${id}`)
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Redigera bana</h1>
        <Link
          href={`/kurator/kurser/${id}/kontroller`}
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Kontroller ({controlCount})
        </Link>
      </div>

      <form action={updateCourse} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Namn
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={course.name}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Beskrivning
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={course.description ?? ''}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
        </div>

        <div>
          <label htmlFor="course_type" className="mb-1 block text-sm font-medium text-gray-700">
            Bantyp
          </label>
          <select
            id="course_type"
            name="course_type"
            defaultValue={course.course_type}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          >
            <option value="open">Open</option>
            <option value="sequential">Sequential</option>
            <option value="spatial">Spatial</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="active_from" className="mb-1 block text-sm font-medium text-gray-700">
              Aktiv från
            </label>
            <input
              id="active_from"
              name="active_from"
              type="date"
              defaultValue={course.active_from ?? ''}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            />
          </div>
          <div>
            <label htmlFor="active_to" className="mb-1 block text-sm font-medium text-gray-700">
              Aktiv till
            </label>
            <input
              id="active_to"
              name="active_to"
              type="date"
              defaultValue={course.active_to ?? ''}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
            />
          </div>
        </div>

        <fieldset className="rounded-xl border border-gray-100 p-4">
          <legend className="px-2 text-sm font-medium">Åtkomst</legend>
          <div className="mt-2 flex flex-col gap-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="radio" name="access" value="public"
                defaultChecked={!course.requires_premium} className="mt-1" />
              <div>
                <p className="text-sm font-medium">Publik för alla</p>
                <p className="text-xs text-gray-500">Alla användare kan se och stämpla banan</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="radio" name="access" value="premium"
                defaultChecked={course.requires_premium} className="mt-1" />
              <div>
                <p className="text-sm font-medium">Kräver premium</p>
                <p className="text-xs text-gray-500">Bara premium-användare ser och kan stämpla</p>
              </div>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Spara ändringar
        </button>
      </form>

      {/* Publish section */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Publicerings-checklista</h3>
        <ul className="mb-4 space-y-1 text-sm">
          <CheckItem ok={course.name.trim() !== ''} label="Namn angivet" />
          <CheckItem ok={controlCount >= 2} label="Minst 2 kontroller" />
          <CheckItem ok={allNamed} label="Alla kontroller har namn" />
        </ul>

        {course.is_public ? (
          <form action={unpublishCourse}>
            <button
              type="submit"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Avpublicera
            </button>
          </form>
        ) : (
          <form action={publishCourse}>
            <button
              type="submit"
              disabled={!canPublish}
              className="w-full rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Publicera bana
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? 'text-green-700' : 'text-gray-400'}>
      {ok ? '✓' : '○'} {label}
    </li>
  )
}
