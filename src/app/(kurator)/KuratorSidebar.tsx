'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  firstName: string | null
  isAdmin: boolean | null
}

interface NavItem {
  href: string
  label: string
  adminOnly?: boolean
}

interface NavSection {
  title: string
  adminOnly?: boolean
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Orientering',
    items: [
      { href: '/kurator/kurser', label: 'Banor' },
      { href: '/kurator/granskning', label: 'Granskning', adminOnly: true },
    ],
  },
  {
    title: 'POI',
    items: [
      { href: '/kurator/omraden', label: 'Områden' },
      { href: '/kurator/poi', label: 'POI:er' },
    ],
  },
  {
    title: 'Admin',
    adminOnly: true,
    items: [
      { href: '/kurator/anvandare', label: 'Användare' },
      { href: '/kurator/audit', label: 'Audit log' },
    ],
  },
]

export default function KuratorSidebar({ firstName, isAdmin }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/kurator') return pathname === '/kurator'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
          vidder
        </span>
        <span className="ml-1 text-sm text-gray-500">admin</span>
      </div>

      <nav className="flex-1 px-3 py-4">
        <Link
          href="/kurator"
          className={`mb-1 block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            isActive('/kurator')
              ? 'text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={isActive('/kurator') ? { backgroundColor: 'var(--color-primary)' } : undefined}
        >
          Dashboard
        </Link>

        {SECTIONS.map((section) => {
          if (section.adminOnly && !isAdmin) return null

          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || isAdmin
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={section.title}>
              <p className="mt-6 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-1 block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={isActive(item.href) ? { backgroundColor: 'var(--color-primary)' } : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
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
