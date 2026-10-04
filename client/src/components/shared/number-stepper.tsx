import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type NumberStepperProps = { value: number; min: number; max: number; onChange: (n: number) => void }

export function NumberStepper({ value, min, max, onChange }: NumberStepperProps) {
  return (
    <div className="inline-flex items-center rounded-[4px] border bg-background">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Diminuir"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>
      <span className="w-10 text-center text-sm font-medium tabular-nums">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Aumentar"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </div>
  )
}