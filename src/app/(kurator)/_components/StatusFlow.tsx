'use client'

type Status = 'draft' | 'review' | 'published' | 'archived'

interface Props {
  currentStatus: Status
  isAdmin: boolean
  onTransition: (newStatus: Status) => void
  disabled?: boolean
}

export default function StatusFlow({ currentStatus, isAdmin, onTransition, disabled }: Props) {
  return (
    <div className="space-y-2">
      {currentStatus === 'draft' && (
        <button
          type="button"
          onClick={() => onTransition('review')}
          disabled={disabled}
          className="btn-secondary w-full rounded-md py-1.5 text-sm"
        >
          Skicka till granskning
        </button>
      )}
      {currentStatus === 'review' && (
        <>
          <button
            type="button"
            onClick={() => onTransition('draft')}
            disabled={disabled}
            className="btn-secondary w-full rounded-md py-1.5 text-sm"
          >
            Tillbaka till utkast
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => onTransition('published')}
              disabled={disabled}
              className="btn-primary w-full rounded-md py-1.5 text-sm"
            >
              Publicera
            </button>
          )}
        </>
      )}
      {currentStatus === 'published' && isAdmin && (
        <button
          type="button"
          onClick={() => onTransition('draft')}
          disabled={disabled}
          className="btn-secondary w-full rounded-md py-1.5 text-sm"
        >
          Avpublicera
        </button>
      )}
    </div>
  )
}
