'use client'

import { useState } from 'react'

interface Props {
  diff: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null
  operation: string
}

// Fields to hide from diff (noisy, auto-managed)
const HIDDEN_FIELDS = new Set(['updated_at', 'created_at', 'version', 'centroid', 'location', 'geometry'])

export default function AuditDiffRow({ diff, operation }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!diff) return <span className="text-xs text-gray-400">-</span>

  const changes = getChanges(diff, operation)

  if (changes.length === 0) {
    return <span className="text-xs text-gray-400">Inga synliga ändringar</span>
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-medium hover:underline"
        style={{ color: 'var(--color-primary)' }}
      >
        {expanded ? 'Dölj diff' : `Visa diff (${changes.length})`}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 rounded border border-gray-100 bg-gray-50 p-3 text-xs">
          {changes.map((change, i) => (
            <div key={i} className="flex gap-2">
              <span className="w-32 shrink-0 font-medium text-gray-600">{change.field}</span>
              {change.type === 'added' && (
                <span className="text-green-700">{formatValue(change.after)}</span>
              )}
              {change.type === 'removed' && (
                <span className="text-red-600 line-through">{formatValue(change.before)}</span>
              )}
              {change.type === 'changed' && (
                <span>
                  <span className="text-red-600 line-through">{formatValue(change.before)}</span>
                  <span className="mx-1 text-gray-400">&rarr;</span>
                  <span className="text-green-700">{formatValue(change.after)}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface Change {
  field: string
  type: 'added' | 'removed' | 'changed'
  before?: unknown
  after?: unknown
}

function getChanges(
  diff: { before?: Record<string, unknown>; after?: Record<string, unknown> },
  operation: string
): Change[] {
  const changes: Change[] = []

  if (operation === 'insert' && diff.after) {
    for (const [key, val] of Object.entries(diff.after)) {
      if (HIDDEN_FIELDS.has(key)) continue
      if (val == null || val === '' || (Array.isArray(val) && val.length === 0)) continue
      changes.push({ field: key, type: 'added', after: val })
    }
  } else if (operation === 'delete' && diff.before) {
    for (const [key, val] of Object.entries(diff.before)) {
      if (HIDDEN_FIELDS.has(key)) continue
      if (val == null || val === '') continue
      changes.push({ field: key, type: 'removed', before: val })
    }
  } else if (operation === 'update' && diff.before && diff.after) {
    const allKeys = new Set([...Object.keys(diff.before), ...Object.keys(diff.after)])
    for (const key of allKeys) {
      if (HIDDEN_FIELDS.has(key)) continue
      const b = diff.before[key]
      const a = diff.after[key]
      if (JSON.stringify(b) !== JSON.stringify(a)) {
        changes.push({ field: key, type: 'changed', before: b, after: a })
      }
    }
  }

  return changes
}

function formatValue(val: unknown): string {
  if (val == null) return '(tom)'
  if (typeof val === 'boolean') return val ? 'ja' : 'nej'
  if (Array.isArray(val)) return val.join(', ') || '(tom)'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
