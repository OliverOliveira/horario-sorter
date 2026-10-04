import cors from 'cors'
import express from 'express'
import db from './db.js'
import { errorHandler } from './http.js'
import atribuicoes from './routes/atribuicoes.js'
import disciplinas from './routes/disciplinas.js'
import periodos from './routes/periodos.js'
import professores from './routes/professores.js'
import turmas from './routes/turmas.js'
import horariosRouter from './routes/horarios.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  const { v } = db.prepare('SELECT sqlite_version() AS v').get()
  res.json({ ok: true, sqlite: v })
})

app.use('/api/periodos', periodos)
app.use('/api/disciplinas', disciplinas)
app.use('/api/professores', professores)
app.use('/api/turmas', turmas)
app.use('/api/atribuicoes', atribuicoes)
app.use('/api/horarios', horariosRouter)

app.use('/api', (_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }))
app.use(errorHandler)

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`))