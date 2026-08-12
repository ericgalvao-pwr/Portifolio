-- Fases por projeto: cada cliente pode ter sua própria metodologia.
-- Quem estiver com a coluna vazia continua usando as fases padrão da PWR
-- (definidas em PHASES, src/App.jsx). A importação GSB popula esta coluna a
-- partir da aba "Dados" da planilha.
alter table public.projetos add column if not exists fases text[];
