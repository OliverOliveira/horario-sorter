import {
  BookOpen,
  FlaskConical,
  Languages,
  Terminal,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { normalizar } from './utils'

export function iconeDaArea(area: string | null): LucideIcon {
  const a = normalizar(area ?? '')
  if (a.includes('informatica')) return Terminal
  if (a.includes('electro') || a.includes('eletro')) return Zap
  if (a.includes('tecnica')) return Wrench
  if (a.includes('cientif')) return FlaskConical
  if (a.includes('socio')) return Languages
  return BookOpen
}