import { Router } from 'express'
import db from '../db.js'
import { HttpError, optionalText, parseId, requireText } from '../http.js'

const router = Router()

const SELECT = `
  SELECT d.*,
         (SELECT COUNT(*) FROM professor_disciplinas pd WHERE pd.disciplina_id = d.id) AS total_professores
    FROM disciplinas d`

function obter(id) {
  const row = db.prepare(`${SELECT} WHERE d.id = ?`).get(id)
  if (!row) throw new HttpError(404, 'Disciplina não encontrada')
  return row
}

function lerCorpo(body = {}) {
  const carga = body.carga_semanal === undefined ? 1 : Number(body.carga_semanal)
  if (!Number.isInteger(carga) || carga < 1 || carga > 20) {
    throw new HttpError(400, 'carga_semanal deve ser um inteiro entre 1 e 20')
  }
  return {
    nome: requireText(body.nome, 'nome'),
    sigla: optionalText(body.sigla),
    area: optionalText(body.area_curricular),
    carga,
  }
}

router.get('/', (_req, res) => {
  res.json(db.prepare(`${SELECT} ORDER BY d.nome`).all())
})

router.get('/:id', (req, res) => {
  res.json(obter(parseId(req.params.id)))
})

router.post('/', (req, res) => {
  const d = lerCorpo(req.body)
  const { lastInsertRowid } = db
    .prepare(
      'INSERT INTO disciplinas (nome, sigla, area_curricular, carga_semanal) VALUES (?, ?, ?, ?)',
    )
    .run(d.nome, d.sigla, d.area, d.carga)
  res.status(201).json(obter(lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const id = parseId(req.params.id)
  obter(id)
  const d = lerCorpo(req.body)
  db.prepare(
    'UPDATE disciplinas SET nome = ?, sigla = ?, area_curricular = ?, carga_semanal = ? WHERE id = ?',
  ).run(d.nome, d.sigla, d.area, d.carga, id)
  res.json(obter(id))
})

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id)
  obter(id)
  db.prepare('DELETE FROM disciplinas WHERE id = ?').run(id)
  res.status(204).end()
})

export default router