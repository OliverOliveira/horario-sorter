export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function parseId(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'ID inválido')
  return n
}

export function requireText(value, campo) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${campo} é obrigatório`)
  }
  return value.trim()
}

export function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function intList(value, campo, { min = 1, max = Infinity } = {}) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new HttpError(400, `${campo} deve ser uma lista`)
  const nums = value.map(Number)
  if (nums.some((n) => !Number.isInteger(n) || n < min || n > max)) {
    throw new HttpError(400, `${campo} contém valores inválidos`)
  }
  return [...new Set(nums)]
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ erro: err.message })

  const msg = String(err.message ?? '')
  if (msg.includes('UNIQUE constraint')) {
    return res.status(409).json({ erro: 'Já existe um registro com esses dados' })
  }
  if (msg.includes('FOREIGN KEY constraint')) {
    return res.status(409).json({
      erro: 'Operação inválida: registro relacionado não existe ou está em uso',
    })
  }
  if (msg.includes('CHECK constraint')) {
    return res.status(400).json({ erro: 'Valor fora do permitido' })
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ erro: 'Requisição inválida' })
  }
  console.error(err)
  res.status(500).json({ erro: 'Erro interno do servidor' })
}