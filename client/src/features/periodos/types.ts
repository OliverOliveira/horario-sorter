export type Tempo = { numero: number; hora_inicio: string; hora_fim: string }
export type Periodo = { id: number; nome: string; intervalo_apos_tempo: number; tempos: Tempo[] }