# Horário Sorter

Aplicação para gestão de horários escolares e geração automatizada de grade curricular.

O projeto combina um painel administrativo em React com uma API em Express e um banco SQLite para registrar professores, disciplinas, turmas, períodos e atribuições, além de gerar horários respeitando conflitos e preferências.

## Visão geral

O Horário Sorter foi pensado para facilitar o processo de organização do calendário letivo de uma instituição, permitindo:

- cadastrar e manter períodos letivos;
- registrar professores, disciplinas e turmas;
- definir atribuições de disciplinas por turma e professor;
- configurar preferências de dias e prioridades dos professores;
- gerar versões de horários com algoritmo heurístico/recocido simulado;
- visualizar conflitos, métricas e histórico de execuções;
- exportar a grade gerada em CSV.

## Stack

- Frontend: React + TypeScript + Vite
- UI: Tailwind + componentes reutilizáveis
- Backend: Node.js + Express
- Banco de dados: SQLite
- Geração de horários: algoritmo customizado em JavaScript com restrições duras e custos suaves

## Estrutura do projeto

```text
horario-sorter/
├── client/                # Frontend em React
│   ├── src/
│   ├── package.json
│   └── vite.config.*
├── server/                # API e lógica de persistência
│   ├── src/
│   ├── data/
│   └── package.json
├── LICENSE
└── README.md
```

## Funcionalidades principais

### Gestão de dados

- Períodos e tempos de aula
- Professores com prioridade e dias preferenciais
- Disciplinas com área curricular e carga semanal
- Turmas com sala, curso e classe
- Atribuições disciplina/turma/professor

### Geração de horários

A API do backend implementa um gerador de horários que tenta organizar as aulas respeitando:

- um professor não pode ter duas aulas no mesmo tempo;
- uma turma não pode ter duas aulas no mesmo tempo;
- uma sala não pode receber mais de uma aula no mesmo intervalo;
- preferências de dias e janelas de professores/turmas são minimizadas;
- blocos de aulas seguem a lógica de compactação por disciplina.

### Dashboard e monitoramento

A interface mostra painel geral com métricas, pendências, distribuição por período e histórico de horários gerados.

## Como executar

### Pré-requisitos

- Node.js 18+
- npm

### 1) Instale as dependências

```bash
cd server
npm install

cd ../client
npm install
```

### 2) Inicie o backend

```bash
cd server
npm run dev
```

A API ficará disponível em:

- http://localhost:3001/api/health

### 3) Inicie o frontend

Em outro terminal:

```bash
cd client
npm run dev
```

A aplicação web ficará disponível em:

- http://localhost:5173

## API principal

A API expõe rotas para recursos como:

- `/api/periodos`
- `/api/disciplinas`
- `/api/professores`
- `/api/turmas`
- `/api/atribuicoes`
- `/api/horarios`

O banco é armazenado em:

- `server/data/horarios.db`

## Fluxo de uso típico

1. Cadastre os períodos e os tempos de aula.
2. Registre professores, disciplinas e turmas.
3. Defina as atribuições entre turmas, disciplinas e professores.
4. Acesse a tela de geração de horário.
5. Escolha o período e as turmas elegíveis.
6. Gere uma simulação ou grave uma versão de horário.
7. Revise conflitos, métricas e histórico.
8. Exporte a grade em CSV, se necessário.

## Observações

- O backend cria automaticamente o banco de dados SQLite e as tabelas iniciais na primeira execução.
- A geração usa um algoritmo iterativo e pode exigir ajustes de parâmetros como número de iterações, limite de tempo e peso de janelas para obter um resultado melhor.
- O projeto está organizado como um monorepo simples com dois módulos independentes: frontend e backend.

## Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).
