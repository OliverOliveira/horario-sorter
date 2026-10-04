import { Moon, Sun } from 'lucide-react'
import { Panel } from '@/components/shared/panel'
import { ProgressBar } from '@/components/shared/progress-bar'
import { SectionLabel } from '@/components/shared/section-label'
import type { PeriodoResumo } from '../types'

const icones = { Manhã: Sun, Tarde: Moon } as const

export function PeriodDistribution({ periodos }: { periodos: PeriodoResumo[] }) {
  const totalTurmas = periodos.reduce((soma, p) => soma + p.totalTurmas, 0)

  return (
    <Panel
      eyebrow="Distribuição de turmas"
      title="Turmas por Período"
      action={
        <span className="rounded-[3px] bg-muted px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {periodos.length} turnos
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Total: {totalTurmas} turmas distribuídas em {periodos.length} turnos regulamentares
          </span>
          <SectionLabel>100% regulado</SectionLabel>
        </div>
      }
    >
      <div className="space-y-6">
        {periodos.map((p, i) => {
          const Icon = icones[p.nome]
          return (
            <div key={p.nome} className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="font-medium">{p.nome}</span>
                  <span className="text-muted-foreground">({p.horario})</span>
                </div>
                <div className="tabular-nums">
                  <span className="font-medium">{p.totalTurmas} Turmas</span>{' '}
                  <span className="text-muted-foreground">{p.percentual}%</span>
                </div>
              </div>
              <ProgressBar value={p.percentual} tone={i === 0 ? 'strong' : 'soft'} />
              <div className="rounded-[4px] border px-4 py-3 text-sm">
                <SectionLabel className="mb-1 block">Composição:</SectionLabel>
                {p.composicao}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}