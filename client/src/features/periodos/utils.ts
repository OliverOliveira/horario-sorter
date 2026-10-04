import type { Periodo } from './types'

// "07:30 – 12:35", do primeiro ao último tempo definido
export function faixaHoraria(periodo: Periodo) {
  if (periodo.tempos.length === 0) return 'Tempos não definidos'
  return `${periodo.tempos[0].hora_inicio} – ${periodo.tempos[periodo.tempos.length - 1].hora_fim}`
}