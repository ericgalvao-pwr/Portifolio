-- Fase e origem passam a ser vocabulário do cliente, não do app.
-- Cada projeto tem sua metodologia (ver projetos.fases) e a planilha GSB traz
-- origens próprias ("Agenda", "PE", "RMR", "Visita In Loco"), então a lista fixa
-- no banco brigava com a importação. Status continua com check: é vocabulário do
-- app, e o parser já normaliza os valores do GSB para as chaves de STATUS.

-- Remove qualquer CHECK que envolva as colunas fase ou origem. Feito por descoberta
-- em vez de nome fixo porque o DDL original não está no repositório — o erro da
-- importação revelou "acoes_origem_check", mas o de fase pode ter outro nome.
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname = 'acoes'
      and con.contype = 'c'
      and exists (
        select 1
        from unnest(con.conkey) k
        join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k
        where a.attname in ('fase', 'origem')
      )
  loop
    execute format('alter table public.acoes drop constraint %I', c.conname);
    raise notice 'constraint removida: %', c.conname;
  end loop;
end $$;

-- A planilha traz ação sem fase (Gosto Mineiro e MatMed: 193 das 332 ações) e sem
-- origem. Sem isto o import falharia de novo caso as colunas sejam NOT NULL.
-- Em coluna já anulável estes comandos não fazem nada.
alter table public.acoes alter column fase drop not null;
alter table public.acoes alter column origem drop not null;
