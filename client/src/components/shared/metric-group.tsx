import { SectionLabel } from './section-label'

type Metric = { label: string; value: string }

export function MetricGroup({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="flex divide-x rounded-[4px] border bg-surface-lowest">
      {metrics.map((m) => (
        <div key={m.label} className="space-y-1 px-4 py-3">
          <SectionLabel>{m.label}</SectionLabel>
          <p className="text-sm font-medium tabular-nums">{m.value}</p>
        </div>
      ))}
    </div>
  )
}