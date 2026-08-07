-- Coluna updated_at em responsaveis.
-- Rodar no SQL Editor do Supabase. Não remove nada, é idempotente.
--
-- updateResponsavel (src/lib/api.js) carimba esta coluna a cada edição.
--
-- Exclusão é definitiva: deleteResponsavel zera o responsavel_id das ações
-- daquela pessoa e só depois apaga a linha, então o FK não barra o delete e
-- nenhuma mudança de schema é necessária para isso.

alter table public.responsaveis
  add column if not exists updated_at timestamptz not null default now();


-- ------------------------------------------------------------
-- Limpeza, só se você chegou a rodar a versão de soft delete
-- ------------------------------------------------------------
-- Aquela versão criava uma coluna deleted_at e um índice único de e-mail.
-- Nada no app usa mais os dois. A coluna é inofensiva se ficar; o índice
-- continua barrando e-mail repetido no mesmo projeto — se não quiser essa
-- regra, derrube-o. Ambos contêm DROP, rode só se for a sua intenção:

--   drop index if exists public.responsaveis_email_uniq;
--   drop index if exists public.responsaveis_email_ativo_uniq;
--   alter table public.responsaveis drop column if exists deleted_at;
