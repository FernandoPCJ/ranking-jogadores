-- =========================================================
-- PERFIL PÚBLICO COMPLETO + HISTÓRICO DE SELEÇÕES/MVPS
-- Ranking de Jogadores
-- =========================================================

create or replace function public.classificacao_semanal_historica()
returns table (
  semana_inicio date,
  jogador_id bigint,
  nome text,
  gols_semana integer,
  assistencias_semana integer,
  vitorias_semana integer,
  pontos_semana integer,
  colocacao bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with agregados_base as (
    select
      date_trunc('week', pa.data::timestamp)::date as semana_inicio,
      j.id as jogador_id,
      j.nome,
      sum(ep.gols)::integer as gols_semana,
      sum(ep.assistencias)::integer as assistencias_semana,
      sum(ep.vitorias)::integer as vitorias_semana
    from public.estatisticas_partida ep
    join public.partidas pa
      on pa.id = ep.partida_id
    join public.jogadores j
      on j.id = ep.jogador_id
    group by
      date_trunc('week', pa.data::timestamp)::date,
      j.id,
      j.nome
  ),
  pontuados as (
    select
      ab.*,
      public.calcular_pontuacao_competitiva(
        ab.gols_semana,
        ab.assistencias_semana,
        ab.vitorias_semana
      ) as pontos_semana
    from agregados_base ab
  )
  select
    p.semana_inicio,
    p.jogador_id,
    p.nome,
    p.gols_semana,
    p.assistencias_semana,
    p.vitorias_semana,
    p.pontos_semana,
    row_number() over (
      partition by p.semana_inicio
      order by
        p.pontos_semana desc,
        p.vitorias_semana desc,
        p.gols_semana desc,
        p.assistencias_semana desc,
        p.nome asc,
        p.jogador_id asc
    ) as colocacao
  from pontuados p;
$$;

comment on function public.classificacao_semanal_historica()
is 'Classificação histórica semanal usada por Seleção da Semana, perfil público e futuros rankings históricos.';

revoke all
on function public.classificacao_semanal_historica()
from public, anon, authenticated;


create or replace function public.obter_perfil_publico(
  p_jogador_id bigint
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with historico as (
    select
      count(*) filter (
        where h.colocacao <= 4
      )::integer as selecoes_semana,
      count(*) filter (
        where h.colocacao = 1
      )::integer as mvps
    from public.classificacao_semanal_historica() h
    where h.jogador_id = p_jogador_id
  )
  select jsonb_build_object(
    'jogador_id', j.id,
    'nome', j.nome,
    'apelido', p.apelido,
    'bio', p.bio,
    'foto_url', p.foto_url,
    'gols', j.gols,
    'assistencias', j.assistencias,
    'vitorias', j.vitorias,
    'estrelas', j.estrelas,
    'posicao', c.posicao,
    'pe_dominante', c.pe_dominante,
    'pac', c.pac,
    'sho', c.sho,
    'pas', c.pas,
    'dri', c.dri,
    'def', c.def,
    'phy', c.phy,
    'card_configurado',
      (
        c.posicao is not null
        and c.pe_dominante is not null
      ),
    'selecoes_semana', coalesce(h.selecoes_semana, 0),
    'mvps', coalesce(h.mvps, 0)
  )
  from public.jogadores j
  left join public.perfis p
    on p.jogador_id = j.id
  left join public.cards_jogadores c
    on c.jogador_id = j.id
  cross join historico h
  where j.id = p_jogador_id
    and j.ativo = true
  limit 1;
$$;

revoke all
on function public.obter_perfil_publico(bigint)
from public, anon;

grant execute
on function public.obter_perfil_publico(bigint)
to authenticated;


create or replace function public.obter_selecao_semana(
  p_data_referencia date
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with periodo as (
    select
      date_trunc(
        'week',
        coalesce(
          p_data_referencia,
          current_date
        )::timestamp
      )::date as inicio
  ),
  limites as (
    select
      inicio,
      (inicio + 6)::date as fim
    from periodo
  ),
  top_quatro as (
    select
      h.semana_inicio,
      h.jogador_id,
      h.nome,
      h.gols_semana,
      h.assistencias_semana,
      h.vitorias_semana,
      h.pontos_semana,
      h.colocacao,
      p.apelido,
      p.foto_url,
      c.posicao,
      c.pe_dominante,
      c.pac,
      c.sho,
      c.pas,
      c.dri,
      c.def,
      c.phy
    from public.classificacao_semanal_historica() h
    join periodo per
      on h.semana_inicio = per.inicio
    left join public.perfis p
      on p.jogador_id = h.jogador_id
    left join public.cards_jogadores c
      on c.jogador_id = h.jogador_id
    where h.colocacao <= 4
  )
  select jsonb_build_object(
    'semana_inicio', l.inicio,
    'semana_fim', l.fim,
    'quantidade_rachas',
      (
        select count(*)::integer
        from public.partidas pa
        where pa.data between l.inicio and l.fim
      ),
    'jogadores',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'colocacao', tq.colocacao,
              'jogador_id', tq.jogador_id,
              'nome', tq.nome,
              'apelido', tq.apelido,
              'foto_url', tq.foto_url,
              'posicao', tq.posicao,
              'pe_dominante', tq.pe_dominante,
              'pac', tq.pac,
              'sho', tq.sho,
              'pas', tq.pas,
              'dri', tq.dri,
              'def', tq.def,
              'phy', tq.phy,
              'gols_semana', tq.gols_semana,
              'assistencias_semana', tq.assistencias_semana,
              'vitorias_semana', tq.vitorias_semana,
              'pontos_semana', tq.pontos_semana
            )
            order by tq.colocacao
          )
          from top_quatro tq
        ),
        '[]'::jsonb
      )
  )
  from limites l;
$$;

revoke all
on function public.obter_selecao_semana(date)
from public, anon;

grant execute
on function public.obter_selecao_semana(date)
to authenticated;


select
  h.semana_inicio,
  h.colocacao,
  h.jogador_id,
  h.nome,
  h.gols_semana,
  h.assistencias_semana,
  h.vitorias_semana,
  h.pontos_semana
from public.classificacao_semanal_historica() h
order by
  h.semana_inicio desc,
  h.colocacao asc;-- =========================================================
-- PERFIL PÚBLICO COMPLETO + HISTÓRICO DE SELEÇÕES/MVPS
-- Ranking de Jogadores
-- =========================================================

create or replace function public.classificacao_semanal_historica()
returns table (
  semana_inicio date,
  jogador_id bigint,
  nome text,
  gols_semana integer,
  assistencias_semana integer,
  vitorias_semana integer,
  pontos_semana integer,
  colocacao bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with agregados_base as (
    select
      date_trunc('week', pa.data::timestamp)::date as semana_inicio,
      j.id as jogador_id,
      j.nome,
      sum(ep.gols)::integer as gols_semana,
      sum(ep.assistencias)::integer as assistencias_semana,
      sum(ep.vitorias)::integer as vitorias_semana
    from public.estatisticas_partida ep
    join public.partidas pa
      on pa.id = ep.partida_id
    join public.jogadores j
      on j.id = ep.jogador_id
    group by
      date_trunc('week', pa.data::timestamp)::date,
      j.id,
      j.nome
  ),
  pontuados as (
    select
      ab.*,
      public.calcular_pontuacao_competitiva(
        ab.gols_semana,
        ab.assistencias_semana,
        ab.vitorias_semana
      ) as pontos_semana
    from agregados_base ab
  )
  select
    p.semana_inicio,
    p.jogador_id,
    p.nome,
    p.gols_semana,
    p.assistencias_semana,
    p.vitorias_semana,
    p.pontos_semana,
    row_number() over (
      partition by p.semana_inicio
      order by
        p.pontos_semana desc,
        p.vitorias_semana desc,
        p.gols_semana desc,
        p.assistencias_semana desc,
        p.nome asc,
        p.jogador_id asc
    ) as colocacao
  from pontuados p;
$$;

comment on function public.classificacao_semanal_historica()
is 'Classificação histórica semanal usada por Seleção da Semana, perfil público e futuros rankings históricos.';

revoke all
on function public.classificacao_semanal_historica()
from public, anon, authenticated;


create or replace function public.obter_perfil_publico(
  p_jogador_id bigint
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with historico as (
    select
      count(*) filter (
        where h.colocacao <= 4
      )::integer as selecoes_semana,
      count(*) filter (
        where h.colocacao = 1
      )::integer as mvps
    from public.classificacao_semanal_historica() h
    where h.jogador_id = p_jogador_id
  )
  select jsonb_build_object(
    'jogador_id', j.id,
    'nome', j.nome,
    'apelido', p.apelido,
    'bio', p.bio,
    'foto_url', p.foto_url,
    'gols', j.gols,
    'assistencias', j.assistencias,
    'vitorias', j.vitorias,
    'estrelas', j.estrelas,
    'posicao', c.posicao,
    'pe_dominante', c.pe_dominante,
    'pac', c.pac,
    'sho', c.sho,
    'pas', c.pas,
    'dri', c.dri,
    'def', c.def,
    'phy', c.phy,
    'card_configurado',
      (
        c.posicao is not null
        and c.pe_dominante is not null
      ),
    'selecoes_semana', coalesce(h.selecoes_semana, 0),
    'mvps', coalesce(h.mvps, 0)
  )
  from public.jogadores j
  left join public.perfis p
    on p.jogador_id = j.id
  left join public.cards_jogadores c
    on c.jogador_id = j.id
  cross join historico h
  where j.id = p_jogador_id
    and j.ativo = true
  limit 1;
$$;

revoke all
on function public.obter_perfil_publico(bigint)
from public, anon;

grant execute
on function public.obter_perfil_publico(bigint)
to authenticated;


create or replace function public.obter_selecao_semana(
  p_data_referencia date
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with periodo as (
    select
      date_trunc(
        'week',
        coalesce(
          p_data_referencia,
          current_date
        )::timestamp
      )::date as inicio
  ),
  limites as (
    select
      inicio,
      (inicio + 6)::date as fim
    from periodo
  ),
  top_quatro as (
    select
      h.semana_inicio,
      h.jogador_id,
      h.nome,
      h.gols_semana,
      h.assistencias_semana,
      h.vitorias_semana,
      h.pontos_semana,
      h.colocacao,
      p.apelido,
      p.foto_url,
      c.posicao,
      c.pe_dominante,
      c.pac,
      c.sho,
      c.pas,
      c.dri,
      c.def,
      c.phy
    from public.classificacao_semanal_historica() h
    join periodo per
      on h.semana_inicio = per.inicio
    left join public.perfis p
      on p.jogador_id = h.jogador_id
    left join public.cards_jogadores c
      on c.jogador_id = h.jogador_id
    where h.colocacao <= 4
  )
  select jsonb_build_object(
    'semana_inicio', l.inicio,
    'semana_fim', l.fim,
    'quantidade_rachas',
      (
        select count(*)::integer
        from public.partidas pa
        where pa.data between l.inicio and l.fim
      ),
    'jogadores',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'colocacao', tq.colocacao,
              'jogador_id', tq.jogador_id,
              'nome', tq.nome,
              'apelido', tq.apelido,
              'foto_url', tq.foto_url,
              'posicao', tq.posicao,
              'pe_dominante', tq.pe_dominante,
              'pac', tq.pac,
              'sho', tq.sho,
              'pas', tq.pas,
              'dri', tq.dri,
              'def', tq.def,
              'phy', tq.phy,
              'gols_semana', tq.gols_semana,
              'assistencias_semana', tq.assistencias_semana,
              'vitorias_semana', tq.vitorias_semana,
              'pontos_semana', tq.pontos_semana
            )
            order by tq.colocacao
          )
          from top_quatro tq
        ),
        '[]'::jsonb
      )
  )
  from limites l;
$$;

revoke all
on function public.obter_selecao_semana(date)
from public, anon;

grant execute
on function public.obter_selecao_semana(date)
to authenticated;


select
  h.semana_inicio,
  h.colocacao,
  h.jogador_id,
  h.nome,
  h.gols_semana,
  h.assistencias_semana,
  h.vitorias_semana,
  h.pontos_semana
from public.classificacao_semanal_historica() h
order by
  h.semana_inicio desc,
  h.colocacao asc;