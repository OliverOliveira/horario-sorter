import type { DisciplinaDetalhe } from './types'

export { normalizar } from '@/lib/text'

// "Pendente" = ainda sem nenhum professor que a lecione
export const estadoDisciplina = (d: DisciplinaDetalhe): 'ativo' | 'pendente' =>
  d.total_professores > 0 ? 'ativo' : 'pendente'

export const rotuloDocentes = (n: number) =>
  `${String(n).padStart(2, '0')} ${n === 1 ? 'docente' : 'docentes'}`

export const rotuloTempos = (n: number) => `${n} ${n === 1 ? 'tempo' : 'tempos'}`