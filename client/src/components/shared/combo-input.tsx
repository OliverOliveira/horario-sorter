import { useId, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

type ComboInputProps = Omit<ComponentProps<typeof Input>, 'list'> & { options: string[] }

export function ComboInput({ options, ...props }: ComboInputProps) {
  const listId = useId()
  return (
    <>
      <Input list={listId} {...props} />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  )
}