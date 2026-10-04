// Remove acentos e maiúsculas: "Física" passa a casar com "fisica"
export const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()