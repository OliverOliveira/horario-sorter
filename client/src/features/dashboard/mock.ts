import { BookOpen, ClipboardList, GraduationCap, Users, type LucideIcon } from 'lucide-react'
import type { HorarioGerado, Pendencia, PeriodoResumo } from './types'

export type Estatistica = { label: string; value: number; icon: LucideIcon; hint: string }

export const estatisticas: Estatistica[] = [
  { label: 'Professores', value: 38, icon: Users, hint: '36 com disponibilidade definida' },
  { label: 'Disciplinas', value: 24, icon: BookOpen, hint: 'Componentes Geral e Técnica' },
  { label: 'Turmas', value: 18, icon: GraduationCap, hint: '10ª, 11ª e 12ª Classes' },
  { label: 'Atribuições', value: 142, icon: ClipboardList, hint: '94% da carga horária alocada' },
]

export const periodos: PeriodoResumo[] = [
  {
    nome: 'Manhã',
    horario: '07:30 – 12:35',
    totalTurmas: 11,
    percentual: 61,
    composicao: '10ª Técn. Informática (3), 11ª Técn. Informática (3), 12ª Informática (2), 10ª Eletrónica (3)',
  },
  {
    nome: 'Tarde',
    horario: '13:00 – 17:20',
    totalTurmas: 7,
    percentual: 39,
    composicao: '10ª Gestão de Sistemas (3), 11ª Gestão (2), 12ª Eletrónica (2)',
  },
]

export const pendencias: Pendencia[] = [
  {
    id: 'p1',
    variant: 'pendente',
    titulo: '3 turmas sem atribuição',
    detalhe: '10ª Técn. Informática – Turma C sem professor de Física',
    acao: 'Resolver',
    to: '/atribuicoes',
  },
  {
    id: 'p2',
    variant: 'pendente',
    titulo: 'Período Tarde sem tempos',
    detalhe: 'Faltam definir as horas dos tempos do turno da tarde',
    acao: 'Resolver',
    to: '/periodos',
  },
  {
    id: 'p3',
    variant: 'pendente',
    titulo: '2 professores sem preferência',
    detalhe: 'Deviluka João e Teresa Gonçalo',
    acao: 'Resolver',
    to: '/professores',
  },
  {
    id: 'p4',
    variant: 'conflito',
    titulo: 'Conflito de professor detectado',
    detalhe: 'Joana Pemba em duas turmas no mesmo tempo, 4ª feira',
    acao: 'Verificar',
    to: '/horarios',
  },
]

export const ultimaChecagem = '11:20'

export const horariosGerados: HorarioGerado[] = [
  { id: 6, periodo: 'Manhã', intervalo: '07:30 – 12:35', turmas: '10ª Técn. Informática – Turmas A, B, C', dataHora: '03/10/2026 10:45', conflitos: '0 conflitos', estado: 'ativo' },
  { id: 5, periodo: 'Manhã', intervalo: '07:30 – 12:35', turmas: '11ª Técn. Informática – Turmas A, B', dataHora: '02/10/2026 16:20', conflitos: '0 conflitos', estado: 'ativo' },
  { id: 4, periodo: 'Tarde', intervalo: '13:00 – 17:20', turmas: '10ª Gestão de Sistemas – Turmas A, B', dataHora: '01/10/2026 09:15', conflitos: '1 pendente', estado: 'pendente' },
  { id: 3, periodo: 'Tarde', intervalo: '13:00 – 17:20', turmas: '12ª Eletrónica e Telecomunicações', dataHora: '30/09/2026 14:02', conflitos: '2 sobreposições', estado: 'conflito' },
  { id: 2, periodo: 'Manhã', intervalo: '07:30 – 12:35', turmas: '12ª Informática – Turmas A, B', dataHora: '29/09/2026 11:30', conflitos: '0 conflitos', estado: 'ativo' },
  { id: 1, periodo: 'Manhã', intervalo: '07:30 – 12:35', turmas: '10ª Eletrónica – Turmas A, B, C', dataHora: '28/09/2026 08:50', conflitos: '0 conflitos', estado: 'ativo' },
]