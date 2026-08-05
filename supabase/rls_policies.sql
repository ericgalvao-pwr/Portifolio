-- ============================================================
-- PWR Gestão — Portfólio: políticas de RLS
-- ============================================================
-- Aplica o controle de acesso NO BANCO. Sem isto, a chave anon
-- (pública, visível no JS do site) lê e escreve todas as tabelas,
-- e o filtro por projeto do app pode ser burlado.
--
-- Regra geral:
--   admin     -> acesso total
--   consultor -> somente os projetos vinculados em perfil_projetos
--   cliente   -> somente os projetos vinculados em perfil_projetos
--
-- Rode no SQL Editor do Supabase. É idempotente: pode rodar de novo.
-- ============================================================

-- ---------- funções auxiliares ----------
-- SECURITY DEFINER para poder ler 'perfis' sem cair na própria RLS
-- (evita recursão infinita nas policies).

create or replace function public.meu_papel()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel from public.perfis where id = auth.uid()
$$;

create or replace function public.sou_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.meu_papel() = 'admin', false)
$$;

-- Projetos que o usuário logado pode ver. Admin vê todos.
create or replace function public.pode_ver_projeto(pid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.sou_admin()
      or exists (
        select 1 from public.perfil_projetos pp
        where pp.perfil_id = auth.uid() and pp.projeto_id = pid
      )
$$;

-- ---------- habilitar RLS ----------
alter table public.perfis           enable row level security;
alter table public.perfil_projetos  enable row level security;
alter table public.projetos         enable row level security;
alter table public.acoes            enable row level security;
alter table public.responsaveis     enable row level security;
alter table public.documentos       enable row level security;
alter table public.followups        enable row level security;
alter table public.atas             enable row level security;
alter table public.solicitacoes     enable row level security;

-- ============================================================
-- perfis
-- ============================================================
drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis
  for select to authenticated
  using (id = auth.uid() or public.sou_admin());

-- Só admin cria/edita/exclui perfis. Ninguém muda o próprio papel:
-- a promoção a admin passa obrigatoriamente por um admin existente.
drop policy if exists perfis_admin_write on public.perfis;
create policy perfis_admin_write on public.perfis
  for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

-- ============================================================
-- perfil_projetos  (os vínculos que a tela de Administração grava)
-- ============================================================
drop policy if exists pp_select on public.perfil_projetos;
create policy pp_select on public.perfil_projetos
  for select to authenticated
  using (perfil_id = auth.uid() or public.sou_admin());

-- Escrita apenas por admin: impede o consultor de se autoliberar.
drop policy if exists pp_admin_write on public.perfil_projetos;
create policy pp_admin_write on public.perfil_projetos
  for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

-- ============================================================
-- projetos
-- ============================================================
drop policy if exists projetos_select on public.projetos;
create policy projetos_select on public.projetos
  for select to authenticated
  using (public.pode_ver_projeto(id));

drop policy if exists projetos_admin_write on public.projetos;
create policy projetos_admin_write on public.projetos
  for all to authenticated
  using (public.sou_admin()) with check (public.sou_admin());

-- ============================================================
-- Tabelas de projeto: leitura e escrita restritas ao projeto liberado.
-- Admin e consultor operam; cliente apenas lê.
-- ============================================================

-- ---- acoes ----
drop policy if exists acoes_select on public.acoes;
create policy acoes_select on public.acoes
  for select to authenticated
  using (public.pode_ver_projeto(projeto_id));

drop policy if exists acoes_write on public.acoes;
create policy acoes_write on public.acoes
  for all to authenticated
  using (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'))
  with check (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'));

-- ---- responsaveis ----
drop policy if exists responsaveis_select on public.responsaveis;
create policy responsaveis_select on public.responsaveis
  for select to authenticated
  using (public.pode_ver_projeto(projeto_id));

drop policy if exists responsaveis_write on public.responsaveis;
create policy responsaveis_write on public.responsaveis
  for all to authenticated
  using (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'))
  with check (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'));

-- ---- documentos ----
drop policy if exists documentos_select on public.documentos;
create policy documentos_select on public.documentos
  for select to authenticated
  using (public.pode_ver_projeto(projeto_id));

drop policy if exists documentos_write on public.documentos;
create policy documentos_write on public.documentos
  for all to authenticated
  using (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'))
  with check (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'));

-- ---- followups ----
drop policy if exists followups_select on public.followups;
create policy followups_select on public.followups
  for select to authenticated
  using (public.pode_ver_projeto(projeto_id));

drop policy if exists followups_write on public.followups;
create policy followups_write on public.followups
  for all to authenticated
  using (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'))
  with check (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'));

-- ---- atas ----
drop policy if exists atas_select on public.atas;
create policy atas_select on public.atas
  for select to authenticated
  using (public.pode_ver_projeto(projeto_id));

drop policy if exists atas_write on public.atas;
create policy atas_write on public.atas
  for all to authenticated
  using (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'))
  with check (public.pode_ver_projeto(projeto_id) and public.meu_papel() in ('admin','consultor'));

-- ============================================================
-- solicitacoes
-- projeto_id pode ser nulo (solicitação sem projeto). Nesse caso,
-- só o próprio solicitante e o admin enxergam.
-- ============================================================
drop policy if exists solicitacoes_select on public.solicitacoes;
create policy solicitacoes_select on public.solicitacoes
  for select to authenticated
  using (
    public.sou_admin()
    or solicitante_email = auth.jwt() ->> 'email'
    or (projeto_id is not null and public.pode_ver_projeto(projeto_id))
  );

-- Qualquer usuário logado abre solicitação, desde que como ele mesmo
-- e em projeto que pode ver.
drop policy if exists solicitacoes_insert on public.solicitacoes;
create policy solicitacoes_insert on public.solicitacoes
  for insert to authenticated
  with check (
    solicitante_email = auth.jwt() ->> 'email'
    and (projeto_id is null or public.pode_ver_projeto(projeto_id))
  );

-- Fechar/observar solicitação: admin e consultor do projeto.
drop policy if exists solicitacoes_update on public.solicitacoes;
create policy solicitacoes_update on public.solicitacoes
  for update to authenticated
  using (
    public.sou_admin()
    or (public.meu_papel() = 'consultor' and projeto_id is not null and public.pode_ver_projeto(projeto_id))
  )
  with check (
    public.sou_admin()
    or (public.meu_papel() = 'consultor' and projeto_id is not null and public.pode_ver_projeto(projeto_id))
  );

drop policy if exists solicitacoes_delete on public.solicitacoes;
create policy solicitacoes_delete on public.solicitacoes
  for delete to authenticated using (public.sou_admin());

-- ============================================================
-- Conferência rápida: nenhuma tabela deve aparecer com rls_ativo = false
-- ============================================================
-- select relname as tabela, relrowsecurity as rls_ativo
-- from pg_class
-- where relnamespace = 'public'::regnamespace and relkind = 'r'
-- order by relname;
