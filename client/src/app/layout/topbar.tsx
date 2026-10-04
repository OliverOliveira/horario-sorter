import { CalendarDays } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ANO_LECTIVO, SCHOOL_NAME } from '@/lib/constants'
import { navItems } from './nav-config'
import { ThemeToggle } from './theme-toggle'

export function Topbar() {
  const { pathname } = useLocation()
  const current = navItems.find((item) => item.to === pathname)?.label ?? ''

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{SCHOOL_NAME}</span>
        <span>/</span>
        <span className="text-foreground">{current}</span>
      </nav>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="font-normal text-muted-foreground">
          <CalendarDays />
          Ano Lectivo {ANO_LECTIVO}
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}