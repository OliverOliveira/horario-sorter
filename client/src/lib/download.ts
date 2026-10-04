type Celula = string | number | null

export function downloadCsv(filename: string, linhas: Celula[][]) {
  const escapar = (v: Celula) => `"${String(v ?? '').replaceAll('"', '""')}"`
  // Separador ";" e BOM para o Excel abrir com acentos corretos
  const csv = linhas.map((l) => l.map(escapar).join(';')).join('\r\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}