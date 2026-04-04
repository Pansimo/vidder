'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  firstName: string | null
  isAdmin: boolean | null
}

const NAV_ITEMS = [
  { href: '/kurator', label: 'Dashboard' },
  { href: '/kurator/kurser', label: 'Banor' },
  { href: '/kurator/anvandare', label: 'Användare' },
]

const ADMIN_ITEMS = [
  { href: '/kurator/granskning', label: 'Granskning' },
]

export default function KuratorSidebar({ firstName, isAdmin }: Props) {
  const pathname = usePathname()

  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS

  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
          vidder
        </span>
        <span className="ml-1 text-sm text-gray-500">admin</span>
      </div>

      <nav className="flex-1 px-3 py-4">
        {items.map((item) => {
          const isActive =
            item.href === '/kurator'
              ? pathname === '/kurator'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={isActive ? { backgroundColor: 'var(--color-primary)' } : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 px-5 py-3">
        <p className="text-sm text-gray-500">
          Inloggad som <span className="font-medium text-gray-800">{firstName ?? 'Kurator'}</span>
        </p>
      </div>
    </aside>
  )
}
