-- =========================================================
-- TEMPORADAS
-- Ranking de Jogadores
--
-- Primeira versão:
-- - cada temporada corresponde a um ano civil;
-- - estatísticas sazonais usam SOMENTE rachas com data registrada;
-- - números antigos/legados, anteriores ao histórico de rachas,
--   continuam válidos na carreira geral, mas não são atribuídos
--   retroativamente a uma temporada.
--
-- A pontuação competitiva reutiliza:
-- public.calcular_pontuacao_competitiva()
-- =========================================================


-- =========================================================
-- 1. LISTA DE TEMPORADAS DISPONÍVEIS
-- =========================================================

create or replace function public.obter_temporadas_disponiveis()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      x.ano
      order by x.ano desc
    ),
    '[]'::jsonb
  )
  from (
    select distinct
      extract(
        year from pa.data
      )::integer as ano

    from public.partidas pa
  ) x;
$$;

revoke all
on function public.obter_temporadas_disponiveis()
from public, anon;

grant execute
on function public.obter_temporadas_disponiveis()
to authenticated;


-- =========================================================
-- 2. DADOS COMPLETOS DE UMA TEMPORADA
-- =========================================================

create or replace function public.obter_temporada(
  p_ano integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_resultado jsonb;
begin
  if
    p_ano is null
    or p_ano < 2000
    or p_ano > 2100
  then
    raise exception
      'Ano da temporada inválido.';
  end if;

  with periodo as (
    select
      make_date(
        p_ano,
        1,
        1
      ) as inicio,

      make_date(
        p_ano,
        12,
        31
      ) as fim
  ),

  partidas_periodo as (
    select
      pa.id,
      pa.data,
      pa.tipo

    from public.partidas pa

    cross join periodo per

    where pa.data between
      per.inicio
      and per.fim
  ),

  agregados_base as (
    select
      j.id as jogador_id,
      j.nome,
      j.ativo,

      p.apelido,
      p.foto_url,

      count(
        distinct ep.partida_id
      )::integer
        as rachas_participados,

      coalesce(
        sum(ep.gols),
        0
      )::integer
        as gols,

      coalesce(
        sum(ep.assistencias),
        0
      )::integer
        as assistencias,

      coalesce(
        sum(ep.vitorias),
        0
      )::integer
        as vitorias

    from public.estatisticas_partida ep

    join partidas_periodo pp
      on pp.id = ep.partida_id

    join public.jogadores j
      on j.id = ep.jogador_id

    left join public.perfis p
      on p.jogador_id = j.id

    group by
      j.id,
      j.nome,
      j.ativo,
      p.apelido,
      p.foto_url
  ),

  historico_semanal as (
    select
      h.jogador_id,

      count(*) filter (
        where h.colocacao <= 4
      )::integer
        as selecoes_semana,

      count(*) filter (
        where h.colocacao = 1
      )::integer
        as mvps

    from public.classificacao_semanal_historica() h

    where extract(
      year from h.semana_inicio
    )::integer = p_ano

    group by
      h.jogador_id
  ),

  pontuados as (
    select
      ab.*,

      public.calcular_pontuacao_competitiva(
        ab.gols,
        ab.assistencias,
        ab.vitorias
      ) as pontos,

      coalesce(
        hs.selecoes_semana,
        0
      ) as selecoes_semana,

      coalesce(
        hs.mvps,
        0
      ) as mvps

    from agregados_base ab

    left join historico_semanal hs
      on hs.jogador_id =
        ab.jogador_id
  ),

  classificados as (
    select
      po.*,

      row_number() over (
        order by
          po.pontos desc,
          po.vitorias desc,
          po.gols desc,
          po.assistencias desc,
          po.nome asc,
          po.jogador_id asc
      ) as colocacao

    from pontuados po
  ),

  resumo as (
    select
      count(*)::integer
        as quantidade_rachas,

      min(pp.data)
        as primeira_data,

      max(pp.data)
        as ultima_data

    from partidas_periodo pp
  ),

  totais as (
    select
      count(*)::integer
        as jogadores_participantes,

      coalesce(
        sum(c.gols),
        0
      )::integer
        as gols,

      coalesce(
        sum(c.assistencias),
        0
      )::integer
        as assistencias,

      coalesce(
        sum(c.vitorias),
        0
      )::integer
        as vitorias

    from classificados c
  )

  select jsonb_build_object(
    'ano',
      p_ano,

    'quantidade_rachas',
      r.quantidade_rachas,

    'primeira_data',
      r.primeira_data,

    'ultima_data',
      r.ultima_data,

    'jogadores_participantes',
      t.jogadores_participantes,

    'gols',
      t.gols,

    'assistencias',
      t.assistencias,

    'vitorias',
      t.vitorias,

    'jogadores',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'colocacao',
                c.colocacao,

              'jogador_id',
                c.jogador_id,

              'nome',
                c.nome,

              'apelido',
                c.apelido,

              'foto_url',
                c.foto_url,

              'ativo',
                c.ativo,

              'rachas_participados',
                c.rachas_participados,

              'gols',
                c.gols,

              'assistencias',
                c.assistencias,

              'vitorias',
                c.vitorias,

              'pontos',
                c.pontos,

              'selecoes_semana',
                c.selecoes_semana,

              'mvps',
                c.mvps
            )

            order by
              c.colocacao
          )

          from classificados c
        ),

        '[]'::jsonb
      )
  )
  into v_resultado

  from resumo r
  cross join totais t;

  return v_resultado;
end;
$$;

revoke all
on function public.obter_temporada(integer)
from public, anon;

grant execute
on function public.obter_temporada(integer)
to authenticated;