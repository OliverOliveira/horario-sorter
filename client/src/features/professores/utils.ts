// utils.ts
import type { Professor } from './types'

export const codigoProfessor = (id: number) => `DOC-${String(id).padStart(3, '0')}`

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

// "Pendente" = ainda sem disciplinas ou sem dias preferenciais definidos
export function estadoProfessor(p: Professor): 'ativo' | 'pendente' {
  return p.disciplinas.length === 0 || p.dias_preferenciais.length === 0 ? 'pendente' : 'ativo'
}