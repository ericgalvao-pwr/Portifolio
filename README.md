# Portfólio PWR

Painel de portfólio de projetos da PWR Gestão — protótipo navegável em React + Vite.

## Rodar local

```bash
npm install
npm run dev
```

## Modo demo x modo banco

O app funciona de duas formas, decididas automaticamente pela presença das variáveis de ambiente:

- **Sem variáveis** -> modo demo: usa dados mock, nada é salvo. Ótimo para navegar/apresentar.
- **Com variáveis do Supabase** -> modo banco: lê e grava de verdade (ações, responsáveis, documentos, solicitações, follow-up e ATA).

### Ativar o modo banco

1. Rode o `portfolio_pwr_schema.sql` no seu projeto Supabase (SQL Editor).
2. Crie um arquivo `.env` na raiz (copie de `.env.example`):

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_publishable_anon
   ```

   > Use a chave **publishable / anon** — nunca a `service_role`.

3. `npm run dev` (ou rebuild). O app passa a persistir no banco.

### Na Vercel

Em **Project -> Settings -> Environment Variables**, adicione as mesmas duas (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) e faça um **Redeploy** (variáveis `VITE_*` entram no build, então precisa reconstruir).

## O que persiste no banco

| Tela | Ação que grava |
|------|----------------|
| Base de Ações | botão **Nova ação** |
| Responsáveis | **Novo responsável** |
| Documentos | **Registrar documento** |
| Solicitações | **Registrar solicitação** |
| Follow-Up | **Salvar no banco** |
| Emissão de ATA | **Preencher ATA** (grava a ata + lança encaminhamentos na Base de Ações) |

Kanban e "Novo projeto" da Administração seguem como demonstração visual (não persistem).

## Build

```bash
npm run build
```

## Stack

React 18 · Vite 5 · Tailwind 3 · Recharts · lucide-react · @supabase/supabase-js
