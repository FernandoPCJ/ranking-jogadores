-- Protege as estatisticas oficiais de gols, assistencias e vitorias.
-- O frontend continua podendo alterar apenas dados administrativos.
-- As RPCs SECURITY DEFINER registrar_racha() e excluir_racha() continuam
-- podendo atualizar as estatisticas internamente.

-- IMPORTANTE: um privilegio UPDATE/INSERT no nivel da tabela tambem vale
-- para todas as colunas. Por isso removemos os privilegios amplos e
-- concedemos somente as colunas permitidas.

revoke update on table public.jogadores from authenticated;
revoke insert on table public.jogadores from authenticated;

-- Edicao administrativa permitida.
grant update (
  nome,
  estrelas,
  ativo,
  atualizado_em
) on table public.jogadores to authenticated;

-- Cadastro administrativo: as estatisticas usam os defaults do banco (0).
grant insert (
  nome,
  estrelas,
  ativo
) on table public.jogadores to authenticated;

-- Mantem leitura para o frontend conforme as politicas RLS existentes.
-- Nao alteramos policies aqui; apenas privilegios de coluna.

-- Verificacoes informativas.
select
  has_column_privilege('authenticated', 'public.jogadores', 'nome', 'UPDATE') as pode_editar_nome,
  has_column_privilege('authenticated', 'public.jogadores', 'estrelas', 'UPDATE') as pode_editar_estrelas,
  has_column_privilege('authenticated', 'public.jogadores', 'gols', 'UPDATE') as pode_editar_gols,
  has_column_privilege('authenticated', 'public.jogadores', 'assistencias', 'UPDATE') as pode_editar_assistencias,
  has_column_privilege('authenticated', 'public.jogadores', 'vitorias', 'UPDATE') as pode_editar_vitorias;