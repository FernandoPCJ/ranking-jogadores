-- =========================================================
-- HALL DA FAMA
-- Ranking de Jogadores
--
-- Objetivo:
-- Disponibilizar em uma única RPC os dados necessários para:
-- - Mais MVPs
-- - Mais Seleções da Semana
-- - Artilheiros
-- - Mais assistências
-- - Mais vitórias
-- - Jogadores Legend (OVR 90+ calculado no frontend)
--
-- Observação:
-- O Overall NÃO é calculado no SQL para não duplicar a regra
-- centralizada em src/utils/overall.ts.
-- =========================================================

create or replace function public.obter_hall_da_fama()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with historico as (
    select
      h.jogador_id,

      count(*) filter (
        where h.colocacao <= 4
      )::integer as selecoes_semana,

      count(*) filter (
        where h.colocacao = 1
      )::integer as mvps

    from public.classificacao_semanal_historica() h

    group by h.jogador_id
  ),

  jogadores_hall as (
    select
      j.id as jogador_id,
      j.nome,
      p.apelido,
      p.foto_url,

      j.gols,
      j.assistencias,
      j.vitorias,
      j.estrelas,

      coalesce(
        h.selecoes_semana,
        0
      ) as selecoes_semana,

      coalesce(
        h.mvps,
        0
      ) as mvps,

      c.posicao,
      c.pe_dominante,
      c.pac,
      c.sho,
      c.pas,
      c.dri,
      c.def,
      c.phy,

      (
        c.posicao is not null
        and c.pe_dominante is not null
      ) as card_configurado

    from public.jogadores j

    left join public.perfis p
      on p.jogador_id = j.id

    left join public.cards_jogadores c
      on c.jogador_id = j.id

    left join historico h
      on h.jogador_id = j.id

    where j.ativo = true
  )

  select jsonb_build_object(
    'jogadores',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'jogador_id', jh.jogador_id,
            'nome', jh.nome,
            'apelido', jh.apelido,
            'foto_url', jh.foto_url,

            'gols', jh.gols,
            'assistencias', jh.assistencias,
            'vitorias', jh.vitorias,
            'estrelas', jh.estrelas,

            'selecoes_semana', jh.selecoes_semana,
            'mvps', jh.mvps,

            'posicao', jh.posicao,
            'pe_dominante', jh.pe_dominante,
            'pac', jh.pac,
            'sho', jh.sho,
            'pas', jh.pas,
            'dri', jh.dri,
            'def', jh.def,
            'phy', jh.phy,

            'card_configurado', jh.card_configurado
          )
          order by jh.nome asc
        )
        from jogadores_hall jh
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all
on function public.obter_hall_da_fama()
from public, anon;

grant execute
on function public.obter_hall_da_fama()
to authenticated;