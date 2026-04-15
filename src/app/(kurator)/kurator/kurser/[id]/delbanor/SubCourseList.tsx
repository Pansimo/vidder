'use client'

import { useState } from 'react'
import { addSubCourse, updateSubCourse, deleteSubCourse } from './actions'

interface SubCourse {
  id: string
  course_id: string
  name: string
  description: string | null
  sort_order: number
}

interface Props {
  courseId: string
  initialSubCourses: SubCourse[]
  controlCounts: Record<string, number>
}

export default function SubCourseList({ courseId, initialSubCourses, controlCounts }: Props) {
  const [subCourses, setSubCourses] = useState(initialSubCourses)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    const result = await addSubCourse(courseId, newName.trim(), newDesc.trim())
    if (result) {
      setSubCourses((prev) => [...prev, result as SubCourse])
      setNewName('')
      setNewDesc('')
    }
    setAdding(false)
  }

  function startEditing(sc: SubCourse) {
    setEditingId(sc.id)
    setEditName(sc.name)
    setEditDesc(sc.description ?? '')
  }

  async function saveEdit(id: string) {
    await updateSubCourse(id, courseId, {
      name: editName.trim(),
      description: editDesc.trim() || null,
    })
    setSubCourses((prev) =>
      prev.map((sc) =>
        sc.id === id ? { ...sc, name: editName.trim(), description: editDesc.trim() || null } : sc
      )
    )
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    const count = controlCounts[id] ?? 0
    const msg = count > 0
      ? `Radera delbana? ${count} kontroll(er) kopplas loss.`
      : 'Radera delbana?'
    if (!confirm(msg)) return
    await deleteSubCourse(id, courseId)
    setSubCourses((prev) => prev.filter((sc) => sc.id !== id))
  }

  return (
    <div>
      {/* List */}
      <div className="mb-6 space-y-2">
        {subCourses.map((sc) => (
          <div
            key={sc.id}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            {editingId === sc.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Beskrivning (valfritt)"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(sc.id)}
                    className="btn-primary rounded-md px-3 py-1 text-xs font-medium"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-md px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{sc.name}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {controlCounts[sc.id] ?? 0} kontroller
                  </span>
                  {sc.description && (
                    <p className="mt-0.5 text-xs text-gray-500">{sc.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditing(sc)}
                    className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Redigera
                  </button>
                  <button
                    onClick={() => handleDelete(sc.id)}
                    className="rounded px-2 py-1 text-xs hover:underline"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    Radera
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {subCourses.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-400">
            Inga delbanor ännu.
          </p>
        )}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Ny delbana</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Namn (obligatoriskt)"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
          <textarea
            rows={2}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Beskrivning (valfritt)"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="btn-primary rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {adding ? 'Skapar...' : 'Skapa delbana'}
          </button>
        </div>
      </form>
    </div>
  )
}
