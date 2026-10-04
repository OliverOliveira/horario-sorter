import { Download, CalendarPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { ANO_LECTIVO } from '@/lib/constants'
import { PendingAlerts } from '../components/pending-alerts'
import { PeriodDistribution } from '../components/period-distribution'
import { RecentSchedulesTable } from '../components/recent-schedules-table'
import { estatisticas, horariosGerados, pendencias, periodos, ultimaChecagem } from '../mock'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestão curricular"
        title="Painel Geral"
        description={`Gestão e monitorização do processo de criação de horários lectivos ${ANO_LECTIVO}`}
        actions={
          <>
            <Button variant="outline">
              <Download />
              Exportar Relatório
            </Button>
            <Link to="/gerar-horario" className={buttonVariants()}>
              <CalendarPlus />
              Gerar horário
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {estatisticas.map((e) => (
          <StatCard key={e.label} label={e.label} value={e.value} icon={e.icon} hint={e.hint} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PeriodDistribution periodos={periodos} />
        <PendingAlerts pendencias={pendencias} ultimaChecagem={ultimaChecagem} />
      </div>

      <RecentSchedulesTable horarios={horariosGerados} />
    </div>
  )
}