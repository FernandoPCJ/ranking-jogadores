-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE FUNCTION public.atualizar_meu_card_basico (
  p_posicao      text,
  p_pe_dominante text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_jogador_id bigint;
  v_posicao_atual text;
  v_pe_dominante_atual text;
begin
  if p_posicao not in (
    'GOL',
    'ZAG',
    'LE',
    'LD',
    'VOL',
    'MC',
    'MEI',
    'PE',
    'PD',
    'ATA'
  ) then
    raise exception 'Posição inválida.';
  end if;

  if p_pe_dominante not in (
    'Direito',
    'Esquerdo',
    'Ambidestro'
  ) then
    raise exception 'Pé dominante inválido.';
  end if;

  select
    c.jogador_id,
    c.posicao,
    c.pe_dominante
  into
    v_jogador_id,
    v_posicao_atual,
    v_pe_dominante_atual
  from public.perfis as p
  join public.cards_jogadores as c
    on c.jogador_id = p.jogador_id
  where p.id = auth.uid()
  for update of c;

  if not found or v_jogador_id is null then
    raise exception 'Card não encontrado para este usuário.';
  end if;

  -- Se os dois campos já foram definidos, a escolha está encerrada.
  if
    v_posicao_atual is not null
    and v_pe_dominante_atual is not null
  then
    raise exception
      'Posição e pé dominante já foram definidos e não podem ser alterados pelo jogador.';
  end if;

  -- Protege também eventuais estados parciais antigos.
  if
    v_posicao_atual is not null
    and v_posicao_atual <> p_posicao
  then
    raise exception
      'A posição já foi definida e não pode ser alterada pelo jogador.';
  end if;

  if
    v_pe_dominante_atual is not null
    and v_pe_dominante_atual <> p_pe_dominante
  then
    raise exception
      'O pé dominante já foi definido e não pode ser alterado pelo jogador.';
  end if;

  update public.cards_jogadores
  set
    posicao = coalesce(
      v_posicao_atual,
      p_posicao
    ),
    pe_dominante = coalesce(
      v_pe_dominante_atual,
      p_pe_dominante
    )
  where jogador_id = v_jogador_id;

  return public.obter_meu_card();
end;
$function$;

REVOKE ALL ON FUNCTION public.atualizar_meu_card_basico(text, text) FROM PUBLIC;

GRANT ALL ON FUNCTION public.atualizar_meu_card_basico(text, text) TO authenticated;

GRANT ALL ON FUNCTION public.atualizar_meu_card_basico(text, text) TO service_role;

CREATE FUNCTION public.atualizar_timestamp_card()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  new.atualizado_em := now();
  return new;
end;
$function$;

GRANT ALL ON FUNCTION public.atualizar_timestamp_card() TO anon;

GRANT ALL ON FUNCTION public.atualizar_timestamp_card() TO authenticated;

GRANT ALL ON FUNCTION public.atualizar_timestamp_card() TO service_role;

CREATE FUNCTION public.calcular_pontos_card (
  p_gols         integer,
  p_assistencias integer,
  p_vitorias     integer
)
  RETURNS integer
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  SET search_path TO ''
  AS $function$
  select
    floor(
      greatest(coalesce(p_gols, 0), 0)::numeric / 3
    )::integer
    +
    floor(
      greatest(coalesce(p_assistencias, 0), 0)::numeric / 3
    )::integer
    +
    floor(
      greatest(coalesce(p_vitorias, 0), 0)::numeric / 3
    )::integer;
$function$;

COMMENT ON FUNCTION public.calcular_pontos_card(integer,integer,integer) IS 'Regra central de evolução do Card: 3 gols, 3 assistências ou 3 vitórias concedem 1 ponto de skill.';

REVOKE ALL ON FUNCTION public.calcular_pontos_card(integer, integer, integer) FROM PUBLIC;

GRANT ALL ON FUNCTION public.calcular_pontos_card(integer, integer, integer) TO service_role;

CREATE FUNCTION public.calcular_pontuacao_competitiva (
  p_gols         integer,
  p_assistencias integer,
  p_vitorias     integer
)
  RETURNS integer
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  SET search_path TO ''
  AS $function$
  select
    greatest(coalesce(p_vitorias, 0), 0) * 5
    +
    greatest(coalesce(p_gols, 0), 0) * 3
    +
    greatest(coalesce(p_assistencias, 0), 0) * 2;
$function$;

COMMENT ON FUNCTION public.calcular_pontuacao_competitiva(integer,integer,integer) IS 'Regra central de pontuação competitiva: vitória=5, gol=3, assistência=2.';

REVOKE ALL ON FUNCTION public.calcular_pontuacao_competitiva(integer, integer, integer) FROM PUBLIC;

GRANT ALL ON FUNCTION public.calcular_pontuacao_competitiva(integer, integer, integer) TO service_role;

CREATE FUNCTION public.criar_card_novo_jogador()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.cards_jogadores (
    jogador_id
  )
  values (
    new.id
  )
  on conflict (jogador_id) do nothing;

  return new;
end;
$function$;

GRANT ALL ON FUNCTION public.criar_card_novo_jogador() TO anon;

GRANT ALL ON FUNCTION public.criar_card_novo_jogador() TO authenticated;

GRANT ALL ON FUNCTION public.criar_card_novo_jogador() TO service_role;

CREATE FUNCTION public.criar_perfil_novo_usuario()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  nome_informado text;
  novo_jogador_id bigint;
begin
  -- Obtém o nome enviado pelo cadastro.
  nome_informado := coalesce(
    nullif(
      trim(
        new.raw_user_meta_data ->> 'nome'
      ),
      ''
    ),
    split_part(
      coalesce(new.email, 'jogador'),
      '@',
      1
    )
  );

  -- Cria automaticamente o jogador.
  insert into public.jogadores (
    nome,
    gols,
    assistencias,
    vitorias,
    estrelas,
    ativo
  )
  values (
    nome_informado,
    0,
    0,
    0,
    0,
    true
  )
  returning id
  into novo_jogador_id;

  -- Cria o perfil já vinculado ao jogador.
  insert into public.perfis (
    id,
    nome,
    tipo,
    jogador_id
  )
  values (
    new.id,
    nome_informado,
    'jogador',
    novo_jogador_id
  );

  return new;
end;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_perfil_novo_usuario();

GRANT ALL ON FUNCTION public.criar_perfil_novo_usuario() TO anon;

GRANT ALL ON FUNCTION public.criar_perfil_novo_usuario() TO authenticated;

GRANT ALL ON FUNCTION public.criar_perfil_novo_usuario() TO service_role;

CREATE FUNCTION public.excluir_racha (
  p_partida_id bigint
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_data date;
  v_tipo text;
begin
  if not exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and tipo = 'admin'
  ) then
    raise exception
      'Apenas administradores podem excluir rachas.';
  end if;

  select
    data,
    tipo
  into
    v_data,
    v_tipo
  from public.partidas
  where id = p_partida_id
  for update;

  if not found then
    raise exception 'Racha não encontrado.';
  end if;

  update public.jogadores j
  set
    gols = greatest(
      coalesce(j.gols, 0)
      - ep.gols,
      0
    ),

    assistencias = greatest(
      coalesce(j.assistencias, 0)
      - ep.assistencias,
      0
    ),

    vitorias = greatest(
      coalesce(j.vitorias, 0)
      - ep.vitorias,
      0
    )
  from public.estatisticas_partida ep
  where ep.partida_id = p_partida_id
    and ep.jogador_id = j.id;

  delete from public.partidas
  where id = p_partida_id;

  return jsonb_build_object(
    'excluido',
    true,

    'partida_id',
    p_partida_id,

    'data',
    v_data,

    'tipo',
    v_tipo
  );
end;
$function$;

REVOKE ALL ON FUNCTION public.excluir_racha(bigint) FROM PUBLIC;

GRANT ALL ON FUNCTION public.excluir_racha(bigint) TO authenticated;

GRANT ALL ON FUNCTION public.excluir_racha(bigint) TO service_role;

CREATE FUNCTION public.gastar_ponto_card (
  p_atributo text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_card_id bigint;

  v_posicao text;
  v_pe_dominante text;

  v_gols integer;
  v_assistencias integer;
  v_vitorias integer;

  v_pac smallint;
  v_sho smallint;
  v_pas smallint;
  v_dri smallint;
  v_def smallint;
  v_phy smallint;

  v_pontos_gastos integer;
  v_pontos_conquistados integer;
  v_pontos_disponiveis integer;
  v_valor_atual integer;
begin
  if p_atributo not in (
    'pac',
    'sho',
    'pas',
    'dri',
    'def',
    'phy'
  ) then
    raise exception 'Atributo inválido.';
  end if;

  select
    c.id,

    c.posicao,
    c.pe_dominante,

    coalesce(j.gols, 0),
    coalesce(j.assistencias, 0),
    coalesce(j.vitorias, 0),

    c.pac,
    c.sho,
    c.pas,
    c.dri,
    c.def,
    c.phy,

    c.pontos_gastos
  into
    v_card_id,

    v_posicao,
    v_pe_dominante,

    v_gols,
    v_assistencias,
    v_vitorias,

    v_pac,
    v_sho,
    v_pas,
    v_dri,
    v_def,
    v_phy,

    v_pontos_gastos
  from public.perfis as p

  join public.jogadores as j
    on j.id = p.jogador_id

  join public.cards_jogadores as c
    on c.jogador_id = j.id

  where p.id = auth.uid()

  for update of c;

  if v_card_id is null then
    raise exception
      'Card não encontrado para este usuário.';
  end if;

  if
    v_posicao is null
    or v_pe_dominante is null
  then
    raise exception
      'Defina sua posição e seu pé dominante antes de evoluir os atributos.';
  end if;

  v_pontos_conquistados :=
    public.calcular_pontos_card(
      v_gols,
      v_assistencias,
      v_vitorias
    );

  v_pontos_disponiveis :=
    v_pontos_conquistados
    - v_pontos_gastos;

  if v_pontos_disponiveis <= 0 then
    raise exception
      'Você não possui pontos disponíveis.';
  end if;

  v_valor_atual :=
    case p_atributo
      when 'pac' then v_pac
      when 'sho' then v_sho
      when 'pas' then v_pas
      when 'dri' then v_dri
      when 'def' then v_def
      when 'phy' then v_phy
    end;

  if v_valor_atual >= 99 then
    raise exception
      'Este atributo já atingiu o máximo de 99.';
  end if;

  update public.cards_jogadores
  set
    pac = case
      when p_atributo = 'pac'
        then pac + 1
      else pac
    end,

    sho = case
      when p_atributo = 'sho'
        then sho + 1
      else sho
    end,

    pas = case
      when p_atributo = 'pas'
        then pas + 1
      else pas
    end,

    dri = case
      when p_atributo = 'dri'
        then dri + 1
      else dri
    end,

    def = case
      when p_atributo = 'def'
        then def + 1
      else def
    end,

    phy = case
      when p_atributo = 'phy'
        then phy + 1
      else phy
    end,

    pontos_gastos =
      pontos_gastos + 1

  where id = v_card_id;

  return public.obter_meu_card();
end;
$function$;

REVOKE ALL ON FUNCTION public.gastar_ponto_card(text) FROM PUBLIC;

GRANT ALL ON FUNCTION public.gastar_ponto_card(text) TO authenticated;

GRANT ALL ON FUNCTION public.gastar_ponto_card(text) TO service_role;

CREATE FUNCTION public.listar_jogadores_publicos()
  RETURNS TABLE (
    id           bigint,
    nome         text,
    gols         integer,
    assistencias integer,
    vitorias     integer,
    estrelas     integer,
    ativo        boolean,
    apelido      text,
    foto_url     text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select
    j.id,
    j.nome,
    j.gols,
    j.assistencias,
    j.vitorias,
    j.estrelas,
    j.ativo,
    p.apelido,
    p.foto_url
  from public.jogadores as j
  left join public.perfis as p
    on p.jogador_id = j.id
  where j.ativo = true
  order by j.nome;
$function$;

REVOKE ALL ON FUNCTION public.listar_jogadores_publicos() FROM PUBLIC;

GRANT ALL ON FUNCTION public.listar_jogadores_publicos() TO authenticated;

GRANT ALL ON FUNCTION public.listar_jogadores_publicos() TO service_role;

CREATE FUNCTION public.listar_rachas_admin (
  p_limite integer DEFAULT 10
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_resultado jsonb;
begin
  if not exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and tipo = 'admin'
  ) then
    raise exception
      'Apenas administradores podem visualizar esta lista.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',
        x.id,

        'data',
        x.data,

        'tipo',
        x.tipo,

        'participantes',
        x.participantes,

        'gols',
        x.gols,

        'assistencias',
        x.assistencias,

        'vitorias',
        x.vitorias,

        'criado_em',
        x.criado_em
      )
      order by
        x.data desc,
        x.id desc
    ),
    '[]'::jsonb
  )
  into v_resultado
  from (
    select
      pa.id,
      pa.data,
      pa.tipo,
      pa.criado_em,

      count(ep.id)::integer
        as participantes,

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
    from public.partidas pa

    left join public.estatisticas_partida ep
      on ep.partida_id = pa.id

    group by
      pa.id,
      pa.data,
      pa.tipo,
      pa.criado_em

    order by
      pa.data desc,
      pa.id desc

    limit greatest(
      least(
        coalesce(
          p_limite,
          10
        ),
        50
      ),
      1
    )
  ) x;

  return v_resultado;
end;
$function$;

REVOKE ALL ON FUNCTION public.listar_rachas_admin(integer) FROM PUBLIC;

GRANT ALL ON FUNCTION public.listar_rachas_admin(integer) TO authenticated;

GRANT ALL ON FUNCTION public.listar_rachas_admin(integer) TO service_role;

CREATE FUNCTION public.obter_meu_card()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select jsonb_build_object(
    'jogador_id', j.id,
    'nome', j.nome,
    'apelido', p.apelido,
    'foto_url', p.foto_url,

    'gols', j.gols,
    'assistencias', j.assistencias,
    'vitorias', j.vitorias,
    'estrelas', j.estrelas,

    'pac', c.pac,
    'sho', c.sho,
    'pas', c.pas,
    'dri', c.dri,
    'def', c.def,
    'phy', c.phy,

    'posicao', c.posicao,
    'pe_dominante', c.pe_dominante,

    'pontos_conquistados',
      public.calcular_pontos_card(
        j.gols,
        j.assistencias,
        j.vitorias
      ),

    'pontos_gastos',
      c.pontos_gastos,

    'pontos_disponiveis',
      greatest(
        public.calcular_pontos_card(
          j.gols,
          j.assistencias,
          j.vitorias
        )
        - c.pontos_gastos,
        0
      )
  )
  from public.perfis as p

  join public.jogadores as j
    on j.id = p.jogador_id

  join public.cards_jogadores as c
    on c.jogador_id = j.id

  where p.id = auth.uid()

  limit 1;
$function$;

REVOKE ALL ON FUNCTION public.obter_meu_card() FROM PUBLIC;

GRANT ALL ON FUNCTION public.obter_meu_card() TO authenticated;

GRANT ALL ON FUNCTION public.obter_meu_card() TO service_role;

CREATE FUNCTION public.obter_perfil_publico (
  p_jogador_id bigint
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select jsonb_build_object(
    'jogador_id', j.id,
    'nome', j.nome,
    'apelido', p.apelido,
    'bio', p.bio,
    'foto_url', p.foto_url,
    'gols', j.gols,
    'assistencias', j.assistencias,
    'vitorias', j.vitorias,
    'estrelas', j.estrelas
  )
  from public.jogadores as j
  left join public.perfis as p
    on p.jogador_id = j.id
  where j.id = p_jogador_id
    and j.ativo = true
  limit 1;
$function$;

REVOKE ALL ON FUNCTION public.obter_perfil_publico(bigint) FROM PUBLIC;

GRANT ALL ON FUNCTION public.obter_perfil_publico(bigint) TO authenticated;

GRANT ALL ON FUNCTION public.obter_perfil_publico(bigint) TO service_role;

CREATE FUNCTION public.obter_selecao_semana (
  p_data_referencia date
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  with limites as (
    select
      date_trunc(
        'week',
        coalesce(
          p_data_referencia,
          current_date
        )::timestamp
      )::date as inicio
  ),

  periodo as (
    select
      inicio,
      (inicio + 6)::date as fim
    from limites
  ),

  agregados_base as (
    select
      j.id as jogador_id,
      j.nome,
      p.apelido,
      p.foto_url,

      c.posicao,
      c.pe_dominante,
      c.pac,
      c.sho,
      c.pas,
      c.dri,
      c.def,
      c.phy,

      sum(ep.gols)::integer
        as gols_semana,

      sum(ep.assistencias)::integer
        as assistencias_semana,

      sum(ep.vitorias)::integer
        as vitorias_semana

    from public.estatisticas_partida ep

    join public.partidas pa
      on pa.id = ep.partida_id

    join periodo per
      on pa.data between
        per.inicio
        and per.fim

    join public.jogadores j
      on j.id = ep.jogador_id
      and j.ativo = true

    left join public.perfis p
      on p.jogador_id = j.id

    left join public.cards_jogadores c
      on c.jogador_id = j.id

    group by
      j.id,
      j.nome,
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
  ),

  agregados as (
    select
      ab.*,

      public.calcular_pontuacao_competitiva(
        ab.gols_semana,
        ab.assistencias_semana,
        ab.vitorias_semana
      ) as pontos_semana

    from agregados_base ab
  ),

  classificados as (
    select
      *,

      row_number() over (
        order by
          pontos_semana desc,
          vitorias_semana desc,
          gols_semana desc,
          assistencias_semana desc,
          nome asc
      ) as colocacao

    from agregados
  ),

  top_quatro as (
    select *
    from classificados
    where colocacao <= 4
  )

  select jsonb_build_object(
    'semana_inicio',
    per.inicio,

    'semana_fim',
    per.fim,

    'quantidade_rachas',
    (
      select count(*)::integer
      from public.partidas pa
      where pa.data between
        per.inicio
        and per.fim
    ),

    'jogadores',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'colocacao',
              tq.colocacao,

            'jogador_id',
              tq.jogador_id,

            'nome',
              tq.nome,

            'apelido',
              tq.apelido,

            'foto_url',
              tq.foto_url,

            'posicao',
              tq.posicao,

            'pe_dominante',
              tq.pe_dominante,

            'pac',
              tq.pac,

            'sho',
              tq.sho,

            'pas',
              tq.pas,

            'dri',
              tq.dri,

            'def',
              tq.def,

            'phy',
              tq.phy,

            'gols_semana',
              tq.gols_semana,

            'assistencias_semana',
              tq.assistencias_semana,

            'vitorias_semana',
              tq.vitorias_semana,

            'pontos_semana',
              tq.pontos_semana
          )
          order by tq.colocacao
        )
        from top_quatro tq
      ),
      '[]'::jsonb
    )
  )

  from periodo per;
$function$;

REVOKE ALL ON FUNCTION public.obter_selecao_semana(date) FROM PUBLIC;

GRANT ALL ON FUNCTION public.obter_selecao_semana(date) TO authenticated;

GRANT ALL ON FUNCTION public.obter_selecao_semana(date) TO service_role;

CREATE FUNCTION public.registrar_racha (
  p_data         date,
  p_tipo         text,
  p_estatisticas jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_partida_id bigint;
  v_item jsonb;

  v_jogador_id bigint;
  v_gols integer;
  v_assistencias integer;
  v_vitorias integer;

  v_quantidade integer := 0;
begin
  if not exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and tipo = 'admin'
  ) then
    raise exception 'Apenas administradores podem registrar rachas.';
  end if;

  if p_data is null then
    raise exception 'Informe a data do racha.';
  end if;

  if p_tipo not in (
    'quarta',
    'sexta',
    'extra'
  ) then
    raise exception 'Tipo de racha inválido.';
  end if;

  if p_estatisticas is null
     or jsonb_typeof(p_estatisticas) <> 'array'
     or jsonb_array_length(p_estatisticas) = 0
  then
    raise exception 'Informe pelo menos um jogador com estatísticas.';
  end if;

  insert into public.partidas (
    data,
    tipo,
    criado_por
  )
  values (
    p_data,
    p_tipo,
    auth.uid()
  )
  returning id
  into v_partida_id;

  for v_item in
    select value
    from jsonb_array_elements(p_estatisticas)
  loop
    begin
      v_jogador_id :=
        (v_item ->> 'jogador_id')::bigint;

      v_gols :=
        greatest(
          coalesce(
            (v_item ->> 'gols')::integer,
            0
          ),
          0
        );

      v_assistencias :=
        greatest(
          coalesce(
            (v_item ->> 'assistencias')::integer,
            0
          ),
          0
        );

      v_vitorias :=
        greatest(
          coalesce(
            (v_item ->> 'vitorias')::integer,
            0
          ),
          0
        );
    exception
      when others then
        raise exception
          'Existem estatísticas inválidas no lançamento.';
    end;

    if not exists (
      select 1
      from public.jogadores
      where id = v_jogador_id
        and ativo = true
    ) then
      raise exception
        'Jogador % não existe ou está inativo.',
        v_jogador_id;
    end if;

    -- Linhas completamente zeradas não precisam entrar no histórico.
    if
      v_gols = 0
      and v_assistencias = 0
      and v_vitorias = 0
    then
      continue;
    end if;

    insert into public.estatisticas_partida (
      partida_id,
      jogador_id,
      gols,
      assistencias,
      vitorias
    )
    values (
      v_partida_id,
      v_jogador_id,
      v_gols,
      v_assistencias,
      v_vitorias
    );

    update public.jogadores
    set
      gols = coalesce(gols, 0) + v_gols,
      assistencias =
        coalesce(assistencias, 0)
        + v_assistencias,
      vitorias =
        coalesce(vitorias, 0)
        + v_vitorias
    where id = v_jogador_id;

    v_quantidade := v_quantidade + 1;
  end loop;

  if v_quantidade = 0 then
    raise exception
      'Nenhuma estatística diferente de zero foi informada.';
  end if;

  return jsonb_build_object(
    'partida_id',
    v_partida_id,

    'data',
    p_data,

    'tipo',
    p_tipo,

    'jogadores_registrados',
    v_quantidade
  );
end;
$function$;

REVOKE ALL ON FUNCTION public.registrar_racha(date, text, jsonb) FROM PUBLIC;

GRANT ALL ON FUNCTION public.registrar_racha(date, text, jsonb) TO authenticated;

GRANT ALL ON FUNCTION public.registrar_racha(date, text, jsonb) TO service_role;

CREATE TABLE public.cards_jogadores (
  id            bigint                   GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  jogador_id    bigint                   NOT NULL,
  pac           smallint                 DEFAULT 50 NOT NULL,
  sho           smallint                 DEFAULT 50 NOT NULL,
  pas           smallint                 DEFAULT 50 NOT NULL,
  dri           smallint                 DEFAULT 50 NOT NULL,
  def           smallint                 DEFAULT 50 NOT NULL,
  phy           smallint                 DEFAULT 50 NOT NULL,
  posicao       text,
  pe_dominante  text,
  pontos_gastos integer                  DEFAULT 0 NOT NULL,
  criado_em     timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.cards_jogadores
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_def_check CHECK (def >= 50 AND def <= 99);

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_dri_check CHECK (dri >= 50 AND dri <= 99);

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_jogador_id_key UNIQUE (jogador_id);

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_pac_check CHECK (pac >= 50 AND pac <= 99);

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_pas_check CHECK (pas >= 50 AND pas <= 99);

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_pe_dominante_check CHECK (pe_dominante IS NULL OR (pe_dominante = ANY (ARRAY['Direito'::text, 'Esquerdo'::text, 'Ambidestro'::text])));

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_phy_check CHECK (phy >= 50 AND phy <= 99);

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_pkey PRIMARY KEY (id);

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_pontos_gastos_check CHECK (pontos_gastos >= 0);

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_posicao_check
    CHECK (posicao IS NULL OR (posicao = ANY (ARRAY['GOL'::text, 'ZAG'::text, 'LE'::text, 'LD'::text, 'VOL'::text, 'MC'::text, 'MEI'::text, 'PE'::text, 'PD'::text, 'ATA'::text])));

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_sho_check CHECK (sho >= 50 AND sho <= 99);

GRANT ALL ON public.cards_jogadores TO service_role;

CREATE TRIGGER trg_atualizar_timestamp_card
  BEFORE UPDATE ON public.cards_jogadores
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_timestamp_card();

CREATE TABLE public.estatisticas_partida (
  id           bigint                   GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  partida_id   bigint                   NOT NULL,
  jogador_id   bigint                   NOT NULL,
  gols         integer                  DEFAULT 0 NOT NULL,
  assistencias integer                  DEFAULT 0 NOT NULL,
  vitorias     integer                  DEFAULT 0 NOT NULL,
  criado_em    timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.estatisticas_partida
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.estatisticas_partida
  ADD CONSTRAINT estatisticas_partida_assistencias_check CHECK (assistencias >= 0);

ALTER TABLE public.estatisticas_partida
  ADD CONSTRAINT estatisticas_partida_gols_check CHECK (gols >= 0);

ALTER TABLE public.estatisticas_partida
  ADD CONSTRAINT estatisticas_partida_jogador_unique UNIQUE (partida_id, jogador_id);

ALTER TABLE public.estatisticas_partida
  ADD CONSTRAINT estatisticas_partida_pkey PRIMARY KEY (id);

ALTER TABLE public.estatisticas_partida
  ADD CONSTRAINT estatisticas_partida_vitorias_check CHECK (vitorias >= 0);

GRANT ALL ON public.estatisticas_partida TO service_role;

CREATE INDEX idx_estatisticas_partida_jogador ON public.estatisticas_partida (jogador_id);

CREATE INDEX idx_estatisticas_partida_partida ON public.estatisticas_partida (partida_id);

CREATE TABLE public.jogadores (
  id            bigint                   GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  nome          text                     NOT NULL,
  gols          integer                  DEFAULT 0 NOT NULL,
  assistencias  integer                  DEFAULT 0 NOT NULL,
  vitorias      integer                  DEFAULT 0 NOT NULL,
  estrelas      integer                  DEFAULT 0 NOT NULL,
  ativo         boolean                  DEFAULT true NOT NULL,
  criado_em     timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.jogadores
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.jogadores
  ADD CONSTRAINT jogadores_assistencias_nao_negativas CHECK (assistencias >= 0);

ALTER TABLE public.jogadores
  ADD CONSTRAINT jogadores_estrelas_nao_negativas CHECK (estrelas >= 0);

ALTER TABLE public.jogadores
  ADD CONSTRAINT jogadores_gols_nao_negativos CHECK (gols >= 0);

ALTER TABLE public.jogadores
  ADD CONSTRAINT jogadores_nome_nao_vazio CHECK (char_length(TRIM(BOTH FROM nome)) > 0);

ALTER TABLE public.jogadores
  ADD CONSTRAINT jogadores_pkey PRIMARY KEY (id);

ALTER TABLE public.cards_jogadores
  ADD CONSTRAINT cards_jogadores_jogador_id_fkey FOREIGN KEY (jogador_id) REFERENCES public.jogadores(id) ON DELETE CASCADE;

ALTER TABLE public.estatisticas_partida
  ADD CONSTRAINT estatisticas_partida_jogador_id_fkey FOREIGN KEY (jogador_id) REFERENCES public.jogadores(id) ON DELETE CASCADE;

ALTER TABLE public.jogadores
  ADD CONSTRAINT jogadores_vitorias_nao_negativas CHECK (vitorias >= 0);

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.jogadores TO anon;

GRANT INSERT (assistencias, ativo, estrelas, gols, nome, vitorias) ON public.jogadores TO authenticated;

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.jogadores TO authenticated;

GRANT UPDATE (assistencias, ativo, atualizado_em, estrelas, gols, nome, vitorias) ON public.jogadores TO authenticated;

GRANT ALL ON public.jogadores TO service_role;

CREATE TRIGGER trg_criar_card_novo_jogador
  AFTER INSERT ON public.jogadores
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_card_novo_jogador();

CREATE POLICY "Qualquer pessoa pode visualizar jogadores ativos" ON public.jogadores
  FOR SELECT
  TO anon, authenticated
  USING ((ativo = true));

CREATE TABLE public.partidas (
  id         bigint                   GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  data       date                     NOT NULL,
  tipo       text                     NOT NULL,
  criado_por uuid,
  criado_em  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.partidas
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.partidas
  ADD CONSTRAINT partidas_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.partidas
  ADD CONSTRAINT partidas_data_tipo_unique UNIQUE (DATA, tipo);

ALTER TABLE public.partidas
  ADD CONSTRAINT partidas_pkey PRIMARY KEY (id);

ALTER TABLE public.estatisticas_partida
  ADD CONSTRAINT estatisticas_partida_partida_id_fkey FOREIGN KEY (partida_id) REFERENCES public.partidas(id) ON DELETE CASCADE;

ALTER TABLE public.partidas
  ADD CONSTRAINT partidas_tipo_check CHECK (tipo = ANY (ARRAY['quarta'::text, 'sexta'::text, 'extra'::text]));

GRANT ALL ON public.partidas TO service_role;

CREATE INDEX idx_partidas_data ON public.partidas (DATA);

CREATE TABLE public.perfis (
  id            uuid                     NOT NULL,
  nome          text                     NOT NULL,
  tipo          text                     DEFAULT 'jogador'::text NOT NULL,
  criado_em     timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
  jogador_id    bigint,
  apelido       text,
  bio           text,
  foto_url      text
);

CREATE POLICY "Administradores podem atualizar jogadores" ON public.jogadores
  FOR UPDATE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.perfis
  WHERE ((perfis.id = ( SELECT auth.uid() AS uid)) AND (perfis.tipo = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.perfis
  WHERE ((perfis.id = ( SELECT auth.uid() AS uid)) AND (perfis.tipo = 'admin'::text)))));

CREATE POLICY "Administradores podem cadastrar jogadores" ON public.jogadores
  FOR INSERT
  TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.perfis
  WHERE ((perfis.id = ( SELECT auth.uid() AS uid)) AND (perfis.tipo = 'admin'::text)))));

CREATE POLICY "Administradores podem visualizar todos os jogadores" ON public.jogadores
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.perfis
  WHERE ((perfis.id = ( SELECT auth.uid() AS uid)) AND (perfis.tipo = 'admin'::text)))));

ALTER TABLE public.perfis
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_apelido_tamanho_check CHECK (apelido IS NULL OR char_length(apelido) <= 40);

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_bio_tamanho_check CHECK (bio IS NULL OR char_length(bio) <= 300);

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_jogador_id_fkey FOREIGN KEY (jogador_id) REFERENCES public.jogadores(id) ON DELETE SET NULL;

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_jogador_id_key UNIQUE (jogador_id);

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_nome_nao_vazio CHECK (char_length(TRIM(BOTH FROM nome)) > 0);

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_pkey PRIMARY KEY (id);

ALTER TABLE public.perfis
  ADD CONSTRAINT perfis_tipo_valido CHECK (tipo = ANY (ARRAY['admin'::text, 'jogador'::text]));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.perfis TO anon;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.perfis TO authenticated;

GRANT UPDATE (apelido, bio, foto_url) ON public.perfis TO authenticated;

GRANT ALL ON public.perfis TO service_role;

CREATE POLICY "Usuarios podem atualizar o proprio perfil" ON public.perfis
  FOR UPDATE
  TO authenticated
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Usuário pode visualizar o próprio perfil" ON public.perfis
  FOR SELECT
  TO authenticated
  USING ((( SELECT auth.uid() AS uid) = id));
