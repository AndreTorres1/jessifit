# CLAUDE.md — guia do projeto JessiFit

App pessoal de treinos semanais (PWA). O **treinador** escreve treinos em texto
e a app estrutura-os; a **atleta** vê o plano, marca o que fez e vê demonstrações
dos exercícios. Interface em português (pt-PT). Estética "verde energia".

## Comandos

```bash
npm run dev      # servidor de desenvolvimento (modo demo sem .env.local)
npm run build    # typecheck (tsc --noEmit) + build de produção (gera PWA)
npm run lint     # apenas typecheck
npm test         # testes do motor de parsing (Vitest)
```

## Arquitetura

- **`src/engine/`** — lógica pura e testável. `parseWorkouts.ts` transforma o
  texto colado pelo treinador em dados estruturados; nunca descarta linhas
  (o que não encaixa vai para `warnings`). Alterar aqui exige atualizar/rodar os
  testes em `parseWorkouts.test.ts`.
- **`src/data/`** — estado da app. `store.tsx` é o `AppProvider` (contexto único)
  com persistência em `localStorage` via `lib/storage.ts`. `mock.ts` tem os dados
  de exemplo do modo demo.
- **`src/features/`** — uma pasta por área: `auth`, `athlete`, `coach`, `shared`.
  As páginas são carregadas com `React.lazy` (code-splitting por rota em `App.tsx`).
- **`src/components/`** — UI base (`ui.tsx`), widgets (`ProgressRing`, `InstallHint`)
  e `ErrorBoundary`.
- **`src/lib/`** — utilitários: `supabase.ts` (cliente, null em modo demo),
  `text.ts` (normalização, matching de exercícios, YouTube), `image.ts`
  (redimensionar fotos), `storage.ts`, `format.ts`.
- **`supabase/migrations/`** — esquema SQL com RLS. Ver estado da ligação abaixo.

## Convenções

- **Design system:** cores via tokens CSS em `src/index.css` (`--accent`, `--ink`,
  `--surface`…), expostos como utilitários Tailwind (`bg-surface`, `text-ink`).
  Suporta tema claro/escuro. Não usar cores fixas — usar os tokens.
- **Tipografia:** `--font-display` (Bricolage Grotesque), `--font-sans` (Figtree),
  `--font-mono` (JetBrains Mono).
- **Estilo de código:** TypeScript strict, sem `semi`, aspas simples (ver `.prettierrc`).
- **Domínio:** tipos partilhados em `src/types/`. Dias da semana são strings
  canónicas (`segunda`…`domingo`).

## Modo demo vs Supabase

Sem `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` a app corre em **modo demo**
(dados em `localStorage`). A migração SQL e o cliente já existem; falta ligar a
autenticação e substituir o store demo por queries reais (ver tarefas do projeto).

## PWA / iPhone

Instalável via Safari → Partilhar → Adicionar ao ecrã principal. `InstallHint`
mostra a dica no iOS e o prompt nativo no Android. Ícones em `public/` gerados a
partir de `public/favicon.svg`.
