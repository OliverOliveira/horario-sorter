import {
  BookOpen,
  CalendarPlus,
  ClipboardList,
  Clock,
  Columns3,
  GraduationCap,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon }
export type NavSection = { label: string; items: NavItem[] }

export const navSections: NavSection[] = [
  {
    label: 'Gestão escolar',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/professores', label: 'Professores', icon: Users },
      { to: '/disciplinas', label: 'Disciplinas', icon: BookOpen },
      { to: '/turmas', label: 'Turmas', icon: GraduationCap },
      { to: '/atribuicoes', label: 'Atribuições', icon: ClipboardList },
      { to: '/periodos', label: 'Períodos e Tempos', icon: Clock },
    ],
  },
  {
    label: 'Processamento',
    items: [
      { to: '/gerar-horario', label: 'Gerar Horário', icon: CalendarPlus },
      { to: '/horarios', label: 'Horários', icon: Columns3 },
    ],
  },
]

export const navItems: NavItem[] = navSections.flatMap((s) => s.items)