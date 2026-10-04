import { Bell, RefreshCw } from 'lucide-react'
import { AlertItem } from '@/components/shared/alert-item'
import { CountBadge } from '@/components/shared/count-badge'
import { Panel } from '@/components/shared/panel'
import type { Pendencia } from '../types'

type PendingAlertsProps = { pendencias: Pendencia[]; ultimaChecagem: string }

export function PendingAlerts({ pendencias, ultimaChecagem }: PendingAlertsProps) {
  return (
    <Panel
      eyebrow="Verificação do sistema"
      title="Pendências e Alertas"
      badge={<CountBadge>{pendencias.length}</CountBadge>}
      action={<Bell className="size-4 text-muted-foreground" />}
      footer={
        <div className="flex items-center justify-between">
          <span>Última checagem automática às {ultimaChecagem}</span>
          <RefreshCw className="size-4" />
        </div>
      }
    >
      <ul>
        {pendencias.map((p) => (
          <AlertItem
            key={p.id}
            variant={p.variant}
            title={p.titulo}
            description={p.detalhe}
            actionLabel={p.acao}
            to={p.to}
          />
        ))}
      </ul>
    </Panel>
  )
}