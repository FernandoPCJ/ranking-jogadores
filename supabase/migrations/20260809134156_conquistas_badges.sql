-- =========================================================
-- CONQUISTAS / BADGES
-- Ranking de Jogadores
--
-- Conquistas derivadas automaticamente:
-- ⚽ Hat-trick        = 3 gols em um único racha
-- 🎯 Garçom          = 3 assistências em um único racha
-- 🔥 Em Chamas       = 3 Seleções da Semana consecutivas
-- 👑 Rei da Semana   = 5 MVPs
-- ⭐ Consistente      = 10 Seleções da Semana
-- 🏆 Vencedor        = 25 vitórias
-- 💎 Legend          = 90+ OVR (calculado no frontend)
--
-- Não cria tabela de badges e não duplica dados.
-- Tudo é derivado das estatísticas e do histórico existentes.
-- =========================================================

create or replace function public.obter_conquistas_jogador(
  p_jogador_id bigint
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with jogador_base as (
    select
      j.id,
      j.vitorias,
      c.posicao,
      c.pe_dominante,
      c.pac,
      c.sho,
      c.pas,
      c.dri,
      c.def,
      c.phy
    from public.jogadores j
    left join public.cards_jogadores c
      on c.jogador_id = j.id
    where j.id = p_jogador_id
      and j.ativo = true
    limit 1
  ),

  marcas_racha as (
    select
      coalesce(max(ep.gols), 0)::integer
        as max_gols_racha,

      coalesce(max(ep.assistencias), 0)::integer
        as max_assistencias_racha

    from public.estatisticas_partida ep
    where ep.jogador_id = p_jogador_id
  ),

  historico as (
    select
      count(*) filter (
        where h.colocacao <= 4
      )::integer as selecoes_semana,

      count(*) filter (
        where h.colocacao = 1
      )::integer as mvps

    from public.classificacao_semanal_historica() h
    where h.jogador_id = p_jogador_id
  ),

  semanas_selecao as (
    select distinct
      h.semana_inicio
    from public.classificacao_semanal_historica() h
    where h.jogador_id = p_jogador_id
      and h.colocacao <= 4
  ),

  semanas_ordenadas as (
    select
      ss.semana_inicio,

      row_number() over (
        order by ss.semana_inicio
      ) as rn

    from semanas_selecao ss
  ),

  grupos_sequencia as (
    select
      so.semana_inicio,

      (
        so.semana_inicio
        - ((so.rn::integer) * 7)
      ) as grupo

    from semanas_ordenadas so
  ),

  sequencia as (
    select
      coalesce(
        max(contagem),
        0
      )::integer as maior_sequencia_selecao

    from (
      select
        count(*)::integer as contagem
      from grupos_sequencia
      group by grupo
    ) x
  )

  select
    case
      when jb.id is null then null

      else jsonb_build_object(
        'jogador_id',
          jb.id,

        'max_gols_racha',
          mr.max_gols_racha,

        'max_assistencias_racha',
          mr.max_assistencias_racha,

        'maior_sequencia_selecao',
          seq.maior_sequencia_selecao,

        'selecoes_semana',
          coalesce(
            h.selecoes_semana,
            0
          ),

        'mvps',
          coalesce(
            h.mvps,
            0
          ),

        'vitorias',
          coalesce(
            jb.vitorias,
            0
          ),

        'posicao',
          jb.posicao,

        'pe_dominante',
          jb.pe_dominante,

        'pac',
          jb.pac,

        'sho',
          jb.sho,

        'pas',
          jb.pas,

        'dri',
          jb.dri,

        'def',
          jb.def,

        'phy',
          jb.phy,

        'card_configurado',
          (
            jb.posicao is not null
            and jb.pe_dominante is not null
          )
      )
    end

  from jogador_base jb
  cross join marcas_racha mr
  cross join historico h
  cross join sequencia seq;
$$;

revoke all
on function public.obter_conquistas_jogador(bigint)
from public, anon;

grant execute
on function public.obter_conquistas_jogador(bigint)
to authenticated;