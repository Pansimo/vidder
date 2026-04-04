import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteCourse } from './actions'

export default async function KurserPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('orienteering_courses')
    .select('*, orienteering_controls!orienteering_controls_course_id_fkey(count)')
    .order('created_at', { ascending: false })

  const { data: stampStats } = await supabase
    .from('control_stamps')
    .select('course_id')

  const stampsByCourse = (stampStats ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.course_id] = (acc[s.course_id] ?? 0) + 1
    return acc
  }, {})

  const totalStamps = stampStats?.length ?? 0
  const published = courses?.filter((c) => c.is_public).length ?? 0
  const uniqueUsers = new Set(stampStats?.map((s) => s.course_id)).size // approximate active

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Banor</h1>
        <Link
          href="/kurator/kurser/ny"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Ny bana
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard label="Totalt banor" value={courses?.length ?? 0} />
        <StatCard label="Publicerade" value={published} />
        <StatCard label="Stämplar totalt" value={totalStamps} />
        <StatCard label="Aktiva testare" value={uniqueUsers} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3">Typ</th>
              <th className="px-4 py-3">Kontroller</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stämplar</th>
              <th className="px-4 py-3">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses?.map((course) => {
              const controlCount =
                (course.orienteering_controls as { count: number }[])?.[0]?.count ?? 0
              const stamps = stampsByCourse[course.id] ?? 0

              return (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{course.name}</td>
                  <td className="px-4 py-3 text-gray-600">{course.course_type}</td>
                  <td className="px-4 py-3 text-gray-600">{controlCount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge isPublic={course.is_public} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{stamps}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/kurator/kurser/${course.id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        Redigera
                      </Link>
                      <Link
                        href={`/kurator/kurser/${course.id}/kontroller`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        Kontroller
                      </Link>
                      <DeleteButton courseId={course.id} />
                    </div>
                  </td>
                </tr>
              )
            })}
            {(!courses || courses.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Inga banor skapade ännu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function StatusBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        isPublic
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isPublic ? 'Publicerad' : 'Utkast'}
    </span>
  )
}

function DeleteButton({ courseId }: { courseId: string }) {
  async function handleDelete() {
    'use server'
    await deleteCourse(courseId)
  }

  return (
    <form action={handleDelete}>
      <button
        type="submit"
        className="text-sm font-medium hover:underline"
        style={{ color: 'var(--color-danger)' }}
      >
        Ta bort
      </button>
    </form>
  )
}
