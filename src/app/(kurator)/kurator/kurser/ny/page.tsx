import { redirect } from 'next/navigation'
import { createCourse } from '../actions'

export default function NyKursPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const course = await createCourse(formData)
    if (course?.id) {
      redirect(`/kurator/kurser/${course.id}/kontroller`)
    }
    redirect('/kurator/kurser')
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Ny bana</h1>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Namn
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
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
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          >
            <option value="open">Open</option>
            <option value="sequential">Sequential</option>
            <option value="spatial">Spatial</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Beskrivning
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Skapa bana
        </button>
      </form>
    </div>
  )
}
