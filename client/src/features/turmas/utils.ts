import type { Turma } from './types'

// Ex.: "10ª Técnico de Informática – A"
export const rotuloTurma = (t: Turma) => `${t.classe} ${t.curso} – ${t.nome}`

export const codigoTurma = (id: number) => `TURMA-${String(id).padStart(3, '0')}`