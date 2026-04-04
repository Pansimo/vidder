'use client'

import { useState } from 'react'

type AccessLevel = 'public' | 'premium' | 'private'

const OPTIONS: { id: AccessLevel; label: string; desc: string }[] = [
  { id: 'public', label: 'Publik för alla', desc: 'Alla användare kan se och stämpla banan' },
  { id: 'premium', label: 'Kräver premium', desc: 'Bara premium-användare ser och kan stämpla' },
  { id: 'private', label: 'Privat (testläge)', desc: 'Bara kuratorn och inbjudna testare ser banan' },
]

export default function AccessSelector({
  isPublic,
  requiresPremium,
}: {
  isPublic: boolean
  requiresPremium: boolean
}) {
  const initial: AccessLevel = isPublic ? 'public' : requiresPremium ? 'premium' : 'private'
  const [value, setValue] = useState<AccessLevel>(initial)

  return (
    <fieldset className="rounded-xl border border-gray-100 p-4">
      <legend className="px-2 text-sm font-medium">Åtkomst</legend>
      <input type="hidden" name="access" value={value} />
      <div className="mt-2 flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className="flex cursor-pointer items-start gap-3"
            onClick={() => setValue(opt.id)}
          >
            <div
              className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                value === opt.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                  : 'border-gray-300'
              }`}
            />
            <div>
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
