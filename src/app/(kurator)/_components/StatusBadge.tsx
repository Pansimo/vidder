type Status = 'draft' | 'review' | 'published' | 'archived'

const STYLES: Record<Status, string> = {
  draft: 'bg-gray-100 text-gray-600',
  review: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-700',
}

const LABELS: Record<Status, string> = {
  draft: 'Utkast',
  review: 'Granskning',
  published: 'Publicerat',
  archived: 'Arkiverat',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? STYLES.draft}`}
    >
      {LABELS[status] ?? status}
    </span>
  )
}
