'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Area {
  id: string
  name: string
}

interface Props {
  macroAreas: Area[]
  subAreas: Area[]
}

export default function AreaChooser({ macroAreas, subAreas }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const selectedMacro = params.get('macro') ?? ''
  const selectedSub = params.get('sub') ?? ''

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    // Clear sub when macro changes
    if (key === 'macro') next.delete('sub')
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const canContinue = selectedMacro && selectedSub

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          1. Välj makroområde
        </label>
        <select
          value={selectedMacro}
          onChange={e => setParam('macro', e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
        >
          <option value="">Välj makroområde...</option>
          {macroAreas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          2. Välj subområde
        </label>
        <select
          value={selectedSub}
          onChange={e => setParam('sub', e.target.value)}
          disabled={!selectedMacro || subAreas.length === 0}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400"
          style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
        >
          <option value="">
            {!selectedMacro
              ? 'Välj makroområde först...'
              : subAreas.length === 0
                ? 'Inga subområden i valt makroområde'
                : 'Välj subområde...'}
          </option>
          {subAreas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <a
        href={canContinue ? `/kurator/omraden/${selectedMacro}/sub/${selectedSub}/poi/ny` : undefined}
        className={`btn-primary inline-block rounded-md px-4 py-2 text-sm font-medium ${
          canContinue ? '' : 'pointer-events-none opacity-40'
        }`}
      >
        Fortsätt
      </a>
    </div>
  )
}
