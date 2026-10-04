import { Router } from 'express'
import db from '../db.js'
import { HttpError, optionalText, parseId, requireText } from '../http.js'

const router = Router()

const SELECT = `
  SELECT t.*, p.nome AS periodo
    FROM turmas t
    JOIN periodos p ON p.id = t.periodo_id`

function obter(id) {
  const row = db.prepare(`${SELECT} WHERE t.id = ?`).get(id)
  if (!row) throw new HttpError(404, 'Turma não encontrada')
  return row
}

function lerAlunos(valor) {
  if (valor === undefined || valor === null || valor === '') return null
  const n = Number(valor)
  if (!Number.isInteger(n) || n < 1 || n > 500) {
    throw new HttpError(400, 'alunos deve ser um inteiro entre 1 e 500')
  }
  return n
}

function lerCorpo(body = {}) {
  const periodoId = Number(body.periodo_id)
  if (!Number.isInteger(periodoId) || periodoId <= 0) {
    throw new HttpError(400, 'periodo_id é obrigatório')
  }
  return {
    nome: requireText(body.nome, 'nome'),
    classe: requireText(body.classe, 'classe'),
    curso: requireText(body.curso, 'curso'),
    area: optionalText(body.area_formacao),
    sala: optionalText(body.sala),
    alunos: lerAlunos(body.alunos),
    periodoId,
  }
}

router.get('/', (_req, res) => {
  res.json(db.prepare(`${SELECT} ORDER BY t.classe, t.curso, t.nome`).all())
})

router.get('/:id', (req, res) => {
  res.json(obter(parseId(req.params.id)))
})

router.post('/', (req, res) => {
  const d = lerCorpo(req.body)
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO turmas (nome, classe, curso, area_formacao, sala, alunos, periodo_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(d.nome, d.classe, d.curso, d.area, d.sala, d.alunos, d.periodoId)
  res.status(201).json(obter(lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const id = parseId(req.params.id)
  obter(id)
  const d = lerCorpo(req.body)
  db.prepare(
    `UPDATE turmas
        SET nome = ?, classe = ?, curso = ?, area_formacao = ?, sala = ?, alunos = ?, periodo_id = ?
      WHERE id = ?`,
  ).run(d.nome, d.classe, d.curso, d.area, d.sala, d.alunos, d.periodoId, id)
  res.json(obter(id))
})

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id)
  obter(id)
  db.prepare('DELETE FROM turmas WHERE id = ?').run(id)
  res.status(204).end()
})

export default router