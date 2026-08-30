# JessiFit 🌿

App pessoal de treinos semanais (PWA). O **treinador** escreve os treinos em
texto e a app estrutura-os; a **atleta** vê o plano da semana, marca o que fez
(com dificuldade e nota) e pode ver uma demonstração de cada exercício.

> Projeto pessoal. Interface em português. Estética "verde energia".

## Estado

Funciona em **modo demonstração** (dados de exemplo em `localStorage`, sem
backend). Falta apenas ligar o Supabase (auth + base de dados) para dados reais.

### Funcionalidades

**Atleta**
- Vista "Hoje" com treino do dia, anel de progresso da semana e streak
- Marcar treino como concluído (com dificuldade e nota) ou como falhado (com motivo)
- Check-off por exercício durante o treino + cronómetro de descanso
- Demonstração de cada exercício (vídeo/foto) ligada por nome
- Semana inteira visível + histórico de semanas anteriores
- Celebração (confetti) ao completar a semana

**Treinador**
- Importação do plano por texto, com pré-visualização e avisos
- Editar a semana atual ou criar a próxima
- Painel de progresso: cumprimento, streak de semanas, feedback da atleta
- Biblioteca de exercícios (vídeo/foto) com pesquisa e filtro por grupo muscular
- Partilhar o plano por WhatsApp / Web Share

**Transversal**
- PWA instalável (iOS/Android) com aviso de nova versão
- Tema claro/escuro/automático, toasts, transições, onboarding
- Acessibilidade (Escape fecha modais, foco visível, reduced-motion)

## Stack

- **Frontend:** React 18 + Vite + TypeScript (strict) + Tailwind v4
- **PWA:** `vite-plugin-pwa` (instalável no ecrã inicial do iPhone)
- **Backend:** Supabase (Postgres + Auth + RLS) — ver `supabase/migrations/`
- **Ícones:** lucide-react
- **Testes:** Vitest (motor de parsing)

## Estrutura

```
src/
  engine/      Motor de importação de texto (parser puro) + testes
  data/        Estado da app (store) e dados de exemplo (modo demo)
  features/
    auth/      Entrada / seleção de perfil
    athlete/   Vistas da atleta (Hoje, Semana)
    coach/     Vistas do treinador (Painel, Importar)
    shared/    Componentes e cálculos partilhados (grelha, estatísticas)
  components/  UI base (botões, cartões, logótipo)
  lib/         Cliente Supabase, formatação
  types/       Tipos de domínio
supabase/
  migrations/  Esquema SQL (profiles, exercises, workouts, workout_items, completions) + RLS
```

## Correr localmente

```bash
npm install
npm run dev          # http://localhost:5173  (modo demo, sem backend)
```

Para dados reais, copiar `.env.example` para `.env.local` e preencher com o
projeto Supabase:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Sem estas variáveis, a app corre em **modo demonstração**.

## Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # typecheck + build de produção (gera a PWA)
npm run lint     # typecheck (tsc --noEmit)
npm test         # testes do motor de parsing
```

## Formato de importação de texto

O treinador escreve o plano em texto simples; o parser reconhece:

```
Segunda - Pernas            ← dia + título (após "-" ou ":")
Agachamento 4x8 60kg        ← nome  SxR  peso
Leg press 3x12
Afundos 3x10 cada perna     ← "cada perna" vira nota
Prancha 3x30s               ← tempo
Elevações 3x falha          ← até à falha
Corrida 30min               ← exercício livre

Domingo - descanso          ← dia de descanso
```

Linhas que o parser não perceber **não são descartadas** — aparecem como aviso
na pré-visualização, para o treinador corrigir antes de publicar.

## Instalar no iPhone

Abrir o site no Safari → Partilhar → **Adicionar ao ecrã principal**. A app
passa a abrir em ecrã inteiro, como uma app nativa.
