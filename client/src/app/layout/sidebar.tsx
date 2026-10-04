import { NavLink } from 'react-router-dom'
import { APP_NAME, SCHOOL_ACRONYM, SCHOOL_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { SectionLabel } from '@/components/shared/section-label'
import { navSections } from './nav-config'

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-16 flex-col justify-center border-b px-5">
        <div className="flex items-center gap-2">
          <span className="text-xl font-medium tracking-tight">{APP_NAME}</span>
          <span className="rounded-[3px] bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {SCHOOL_ACRONYM}
          </span>
        </div>
        <SectionLabel className="mt-0.5 text-[10px]">{SCHOOL_NAME}</SectionLabel>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto py-5">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <SectionLabel className="block px-5 pb-2">{section.label}</SectionLabel>
            {section.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative mx-2 flex items-center gap-3 rounded-[4px] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
                    isActive &&
                      'bg-muted font-medium text-foreground before:absolute before:inset-y-0 before:-left-2 before:w-0.5 before:bg-foreground',
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center justify-between rounded-[4px] border px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-foreground" />
            Online local
          </span>
          <span>Lua/AO</span>
        </div>
      </div>
    </aside>
  )
}