import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label="Alternar tema">
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}