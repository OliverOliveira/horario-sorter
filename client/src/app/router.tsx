import { createBrowserRouter } from 'react-router-dom'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { AppLayout } from './layout/app-layout'
import { PlaceholderPage } from '@/components/shared/placeholder-page'
import { navItems } from './layout/nav-config'
import { ProfessoresPage } from '@/features/professores/pages/professores-page'
import { DisciplinasPage } from '@/features/disciplinas/pages/disciplinas-page'
import { TurmasPage } from '@/features/turmas/pages/turmas-page'
import AtribuicoesPage from '@/features/atribuicoes/pages/atribuicoes-page'
import PeriodosPage from '@/features/periodos/pages/periodos-page'
import GerarHorarioPage from '@/features/geracao/pages/gerar-horario-page'
import HorariosPage from '@/features/horarios/pages/horarios-page'

const implementadas = ['/', '/professores', '/disciplinas', '/turmas', '/atribuicoes', '/periodos', '/gerar-horario', '/horarios']

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'professores', element: <ProfessoresPage /> },
      { path: 'disciplinas', element: <DisciplinasPage /> },
      { path: 'turmas', element: <TurmasPage /> },
      { path: 'atribuicoes', element: <AtribuicoesPage /> },
      { path: 'periodos', element: <PeriodosPage /> },
      { path: 'gerar-horario', element: <GerarHorarioPage /> },
      { path: 'horarios', element: <HorariosPage /> },
      ...navItems
        .filter((item) => !implementadas.includes(item.to))
        .map((item) => ({
          path: item.to.slice(1),
          element: <PlaceholderPage title={item.label} />,
        })),
    ],
  },
])