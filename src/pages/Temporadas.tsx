import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Crown,
  Goal,
  Handshake,
  Medal,
  RefreshCw,
  Trophy,
  Users,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router'
import Header from '../components/Header'
import { supabase } from '../lib/supabase'
import {
  PESOS_PONTUACAO_GERAL,
} from '../utils/pontuacao'

type JogadorTemporada = {
  colocacao: number
  jogador_id: number
  nome: string
  apelido: string | null
  foto_url: string | null
  ativo: boolean

  rachas_participados: number
  gols: number
  assistencias: number
  vitorias: number
  pontos: number

  selecoes_semana: number
  mvps: number
}

type DadosTemporada = {
  ano: number

  quantidade_rachas: number
  primeira_data: string | null
  ultima_data: string | null

  jogadores_participantes: number
  gols: number
  assistencias: number
  vitorias: number

  jogadores: JogadorTemporada[]
}

function nomeExibicao(
  jogador: JogadorTemporada,
) {
  return (
    jogador.apelido ||
    jogador.nome
  )
}

function formatarData(
  data: string | null,
) {
  if (!data) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeZone: 'UTC',
    },
  ).format(
    new Date(`${data}T00:00:00Z`),
  )
}

function medalha(
  colocacao: number,
) {
  if (colocacao === 1) {
    return '🥇'
  }

  if (colocacao === 2) {
    return '🥈'
  }

  if (colocacao === 3) {
    return '🥉'
  }

  return `${colocacao}º`
}

function Avatar({
  jogador,
}: {
  jogador: JogadorTemporada
}) {
  const nome =
    nomeExibicao(jogador)

  if (jogador.foto_url) {
    return (
      <img
        src={jogador.foto_url}
        alt={`Foto de ${nome}`}
        className="h-11 w-11 rounded-xl object-cover object-top"
      />
    )
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 font-black text-slate-500">
      {nome
        .charAt(0)
        .toUpperCase()}
    </div>
  )
}

function Temporadas() {
  const anoAtual =
    new Date().getFullYear()

  const [
    temporadasDisponiveis,
    setTemporadasDisponiveis,
  ] = useState<number[]>([])

  const [
    anoSelecionado,
    setAnoSelecionado,
  ] = useState(anoAtual)

  const [
    temporada,
    setTemporada,
  ] = useState<DadosTemporada | null>(
    null,
  )

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] =
    useState('')

  const carregarTemporadas =
    useCallback(async () => {
      const { data, error } =
        await supabase.rpc(
          'obter_temporadas_disponiveis',
        )

      if (error) {
        console.error(
          'Erro ao carregar temporadas disponíveis:',
          error,
        )

        setTemporadasDisponiveis(
          [anoAtual],
        )

        return
      }

      const anos =
        (data as number[] | null) ??
        []

      const lista =
        Array.from(
          new Set([
            anoAtual,
            ...anos,
          ]),
        ).sort(
          (a, b) => b - a,
        )

      setTemporadasDisponiveis(
        lista,
      )
    }, [anoAtual])

  const carregarTemporada =
    useCallback(
      async (ano: number) => {
        setCarregando(true)
        setErro('')

        const { data, error } =
          await supabase.rpc(
            'obter_temporada',
            {
              p_ano: ano,
            },
          )

        if (error) {
          console.error(
            'Erro ao carregar temporada:',
            error,
          )

          setTemporada(null)

          setErro(
            'Não foi possível carregar esta temporada.',
          )

          setCarregando(false)
          return
        }

        setTemporada(
          data as DadosTemporada,
        )

        setCarregando(false)
      },
      [],
    )

  useEffect(() => {
    carregarTemporadas()
  }, [carregarTemporadas])

  useEffect(() => {
    carregarTemporada(
      anoSelecionado,
    )
  }, [
    anoSelecionado,
    carregarTemporada,
  ])

  const indiceAtual =
    temporadasDisponiveis.indexOf(
      anoSelecionado,
    )

  const anoMaisNovo =
    indiceAtual > 0
      ? temporadasDisponiveis[
          indiceAtual - 1
        ]
      : null

  const anoMaisAntigo =
    indiceAtual >= 0 &&
    indiceAtual <
      temporadasDisponiveis.length -
        1
      ? temporadasDisponiveis[
          indiceAtual + 1
        ]
      : null

  const jogadores =
    temporada?.jogadores ?? []

  const destaques =
    useMemo(() => {
      function primeiro(
        campo:
          | 'gols'
          | 'assistencias'
          | 'vitorias'
          | 'mvps'
          | 'selecoes_semana',
      ) {
        return [...jogadores].sort(
          (a, b) =>
            b[campo] -
              a[campo] ||
            b.pontos -
              a.pontos ||
            a.nome.localeCompare(
              b.nome,
              'pt-BR',
            ),
        )[0] ?? null
      }

      return {
        artilheiro:
          primeiro('gols'),

        garcom:
          primeiro(
            'assistencias',
          ),

        vencedor:
          primeiro('vitorias'),

        rei:
          primeiro('mvps'),

        selecao:
          primeiro(
            'selecoes_semana',
          ),
      }
    }, [jogadores])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CalendarRange
                size={21}
              />

              <p className="text-sm font-semibold">
                Histórico anual
              </p>
            </div>

            <h2 className="mt-2 text-3xl font-black">
              Temporadas
            </h2>

            <p className="mt-2 max-w-3xl text-slate-400">
              Acompanhe o desempenho de cada ano sem misturar os resultados de temporadas diferentes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                anoMaisAntigo ===
                null
              }
              onClick={() => {
                if (
                  anoMaisAntigo !==
                  null
                ) {
                  setAnoSelecionado(
                    anoMaisAntigo,
                  )
                }
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
              title="Temporada anterior"
            >
              <ChevronLeft
                size={20}
              />
            </button>

            <select
              value={
                anoSelecionado
              }
              onChange={(event) =>
                setAnoSelecionado(
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
              className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-4 font-bold text-white outline-none focus:border-emerald-500"
            >
              {temporadasDisponiveis.map(
                (ano) => (
                  <option
                    key={ano}
                    value={ano}
                  >
                    Temporada {ano}
                  </option>
                ),
              )}
            </select>

            <button
              type="button"
              disabled={
                anoMaisNovo === null
              }
              onClick={() => {
                if (
                  anoMaisNovo !== null
                ) {
                  setAnoSelecionado(
                    anoMaisNovo,
                  )
                }
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
              title="Temporada seguinte"
            >
              <ChevronRight
                size={20}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                carregarTemporada(
                  anoSelecionado,
                )
              }
              disabled={carregando}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              title="Atualizar temporada"
            >
              <RefreshCw
                size={18}
                className={
                  carregando
                    ? 'animate-spin'
                    : ''
                }
              />
            </button>
          </div>
        </section>

        <section className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm">
            Temporada{' '}
            <strong>
              {anoSelecionado}
            </strong>
          </span>

          <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
            Vitória{' '}
            {
              PESOS_PONTUACAO_GERAL.vitoria
            }{' '}
            pts
          </span>

          <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            Gol{' '}
            {
              PESOS_PONTUACAO_GERAL.gol
            }{' '}
            pts
          </span>

          <span className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
            Assistência{' '}
            {
              PESOS_PONTUACAO_GERAL.assistencia
            }{' '}
            pts
          </span>
        </section>

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <p className="mt-4 text-sm text-slate-400">
              Carregando temporada...
            </p>
          </div>
        ) : temporada ? (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <CalendarRange
                  size={22}
                  className="text-emerald-400"
                />

                <p className="mt-4 text-sm text-slate-400">
                  Rachas
                </p>

                <strong className="mt-1 block text-3xl">
                  {
                    temporada.quantidade_rachas
                  }
                </strong>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <Users
                  size={22}
                  className="text-blue-400"
                />

                <p className="mt-4 text-sm text-slate-400">
                  Jogadores
                </p>

                <strong className="mt-1 block text-3xl">
                  {
                    temporada.jogadores_participantes
                  }
                </strong>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <Goal
                  size={22}
                  className="text-emerald-400"
                />

                <p className="mt-4 text-sm text-slate-400">
                  Gols
                </p>

                <strong className="mt-1 block text-3xl">
                  {temporada.gols}
                </strong>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <Handshake
                  size={22}
                  className="text-purple-400"
                />

                <p className="mt-4 text-sm text-slate-400">
                  Assistências
                </p>

                <strong className="mt-1 block text-3xl">
                  {
                    temporada.assistencias
                  }
                </strong>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <Trophy
                  size={22}
                  className="text-amber-400"
                />

                <p className="mt-4 text-sm text-slate-400">
                  Vitórias
                </p>

                <strong className="mt-1 block text-3xl">
                  {
                    temporada.vitorias
                  }
                </strong>
              </article>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Período registrado
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {formatarData(
                  temporada.primeira_data,
                )}{' '}
                até{' '}
                {formatarData(
                  temporada.ultima_data,
                )}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                As estatísticas desta tela consideram somente rachas registrados com data. Números anteriores à implantação do histórico continuam valendo para a carreira geral, mas não são distribuídos retroativamente por temporada.
              </p>
            </section>

            {jogadores.length > 0 && (
              <section className="mt-8">
                <div className="mb-4">
                  <p className="text-sm font-medium text-amber-400">
                    Prêmios
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    Destaques da Temporada
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    {
                      titulo:
                        'Artilheiro',
                      jogador:
                        destaques.artilheiro,
                      valor:
                        destaques.artilheiro
                          ?.gols ?? 0,
                      unidade:
                        'gols',
                      Icone: Goal,
                    },
                    {
                      titulo:
                        'Garçom',
                      jogador:
                        destaques.garcom,
                      valor:
                        destaques.garcom
                          ?.assistencias ??
                        0,
                      unidade:
                        'assist.',
                      Icone:
                        Handshake,
                    },
                    {
                      titulo:
                        'Vencedor',
                      jogador:
                        destaques.vencedor,
                      valor:
                        destaques.vencedor
                          ?.vitorias ??
                        0,
                      unidade:
                        'vitórias',
                      Icone:
                        Trophy,
                    },
                    {
                      titulo:
                        'Rei da Semana',
                      jogador:
                        destaques.rei,
                      valor:
                        destaques.rei
                          ?.mvps ?? 0,
                      unidade:
                        'MVPs',
                      Icone: Crown,
                    },
                    {
                      titulo:
                        'Seleção de Elite',
                      jogador:
                        destaques.selecao,
                      valor:
                        destaques.selecao
                          ?.selecoes_semana ??
                        0,
                      unidade:
                        'seleções',
                      Icone: Medal,
                    },
                  ].map(
                    ({
                      titulo,
                      jogador,
                      valor,
                      unidade,
                      Icone,
                    }) => (
                      <article
                        key={titulo}
                        className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                      >
                        <Icone
                          size={22}
                          className="text-amber-400"
                        />

                        <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">
                          {titulo}
                        </p>

                        <p className="mt-2 truncate font-black">
                          {jogador
                            ? nomeExibicao(
                                jogador,
                              )
                            : '—'}
                        </p>

                        <p className="mt-1 text-sm text-amber-300">
                          {valor}{' '}
                          {unidade}
                        </p>
                      </article>
                    ),
                  )}
                </div>
              </section>
            )}

            <section className="mt-8">
              <div className="mb-4">
                <p className="text-sm font-medium text-emerald-400">
                  Classificação
                </p>

                <h3 className="mt-1 text-2xl font-black">
                  Ranking da Temporada
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Pontuação calculada apenas com os resultados registrados na temporada {anoSelecionado}.
                </p>
              </div>

              {jogadores.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
                  <CalendarRange
                    size={34}
                    className="mx-auto text-slate-600"
                  />

                  <h4 className="mt-4 text-lg font-bold">
                    Ainda não há resultados nesta temporada
                  </h4>

                  <p className="mt-2 text-sm text-slate-500">
                    Assim que um racha for registrado em {anoSelecionado}, a classificação aparecerá aqui.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 lg:hidden">
                    {jogadores.map(
                      (jogador) => {
                        const conteudo = (
                          <div className="flex items-center gap-3">
                            <div className="w-9 shrink-0 text-center font-black">
                              {medalha(
                                jogador.colocacao,
                              )}
                            </div>

                            <Avatar
                              jogador={
                                jogador
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold">
                                {nomeExibicao(
                                  jogador,
                                )}
                              </p>

                              <p className="text-xs text-slate-500">
                                {jogador.rachas_participados}{' '}
                                rachas
                              </p>
                            </div>

                            <div className="text-right">
                              <strong className="text-xl text-emerald-300">
                                {
                                  jogador.pontos
                                }
                              </strong>

                              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                pontos
                              </p>
                            </div>
                          </div>
                        )

                        return jogador.ativo ? (
                          <Link
                            key={
                              jogador.jogador_id
                            }
                            to={`/jogador/${jogador.jogador_id}`}
                            className="block rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-emerald-500/30"
                          >
                            {conteudo}

                            <div className="mt-4 grid grid-cols-5 gap-2 border-t border-slate-800 pt-4 text-center">
                              <div>
                                <strong>
                                  {
                                    jogador.gols
                                  }
                                </strong>
                                <p className="text-[10px] text-slate-500">
                                  GOL
                                </p>
                              </div>

                              <div>
                                <strong>
                                  {
                                    jogador.assistencias
                                  }
                                </strong>
                                <p className="text-[10px] text-slate-500">
                                  AST
                                </p>
                              </div>

                              <div>
                                <strong>
                                  {
                                    jogador.vitorias
                                  }
                                </strong>
                                <p className="text-[10px] text-slate-500">
                                  VIT
                                </p>
                              </div>

                              <div>
                                <strong>
                                  {
                                    jogador.selecoes_semana
                                  }
                                </strong>
                                <p className="text-[10px] text-slate-500">
                                  SEL
                                </p>
                              </div>

                              <div>
                                <strong>
                                  {
                                    jogador.mvps
                                  }
                                </strong>
                                <p className="text-[10px] text-slate-500">
                                  MVP
                                </p>
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div
                            key={
                              jogador.jogador_id
                            }
                            className="rounded-2xl border border-slate-800 bg-slate-900 p-4 opacity-70"
                          >
                            {conteudo}
                          </div>
                        )
                      },
                    )}
                  </div>

                  <div className="hidden overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 lg:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1050px] text-left">
                        <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-5 py-4">
                              #
                            </th>

                            <th className="px-4 py-4">
                              Jogador
                            </th>

                            <th className="px-4 py-4 text-center">
                              Rachas
                            </th>

                            <th className="px-4 py-4 text-center">
                              Gols
                            </th>

                            <th className="px-4 py-4 text-center">
                              Assist.
                            </th>

                            <th className="px-4 py-4 text-center">
                              Vitórias
                            </th>

                            <th className="px-4 py-4 text-center">
                              Seleções
                            </th>

                            <th className="px-4 py-4 text-center">
                              MVPs
                            </th>

                            <th className="px-5 py-4 text-right">
                              Pontos
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800">
                          {jogadores.map(
                            (
                              jogador,
                            ) => {
                              const linha = (
                                <>
                                  <td className="px-5 py-4 text-lg font-black">
                                    {medalha(
                                      jogador.colocacao,
                                    )}
                                  </td>

                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar
                                        jogador={
                                          jogador
                                        }
                                      />

                                      <div>
                                        <p className="font-bold">
                                          {nomeExibicao(
                                            jogador,
                                          )}
                                        </p>

                                        {jogador.apelido && (
                                          <p className="text-xs text-slate-500">
                                            {
                                              jogador.nome
                                            }
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-4 py-4 text-center">
                                    {
                                      jogador.rachas_participados
                                    }
                                  </td>

                                  <td className="px-4 py-4 text-center text-emerald-400">
                                    {
                                      jogador.gols
                                    }
                                  </td>

                                  <td className="px-4 py-4 text-center">
                                    {
                                      jogador.assistencias
                                    }
                                  </td>

                                  <td className="px-4 py-4 text-center">
                                    {
                                      jogador.vitorias
                                    }
                                  </td>

                                  <td className="px-4 py-4 text-center text-blue-300">
                                    {
                                      jogador.selecoes_semana
                                    }
                                  </td>

                                  <td className="px-4 py-4 text-center text-yellow-300">
                                    {
                                      jogador.mvps
                                    }
                                  </td>

                                  <td className="px-5 py-4 text-right">
                                    <strong className="text-2xl text-emerald-300">
                                      {
                                        jogador.pontos
                                      }
                                    </strong>
                                  </td>
                                </>
                              )

                              return (
                                <tr
                                  key={
                                    jogador.jogador_id
                                  }
                                  className="transition hover:bg-slate-800/40"
                                >
                                  {jogador.ativo ? (
                                    <>
                                      <td className="px-5 py-4 text-lg font-black">
                                        {medalha(
                                          jogador.colocacao,
                                        )}
                                      </td>

                                      <td className="px-4 py-4">
                                        <Link
                                          to={`/jogador/${jogador.jogador_id}`}
                                          className="flex items-center gap-3 transition hover:text-emerald-300"
                                        >
                                          <Avatar
                                            jogador={
                                              jogador
                                            }
                                          />

                                          <div>
                                            <p className="font-bold">
                                              {nomeExibicao(
                                                jogador,
                                              )}
                                            </p>

                                            {jogador.apelido && (
                                              <p className="text-xs text-slate-500">
                                                {
                                                  jogador.nome
                                                }
                                              </p>
                                            )}
                                          </div>
                                        </Link>
                                      </td>

                                      <td className="px-4 py-4 text-center">
                                        {
                                          jogador.rachas_participados
                                        }
                                      </td>

                                      <td className="px-4 py-4 text-center text-emerald-400">
                                        {
                                          jogador.gols
                                        }
                                      </td>

                                      <td className="px-4 py-4 text-center">
                                        {
                                          jogador.assistencias
                                        }
                                      </td>

                                      <td className="px-4 py-4 text-center">
                                        {
                                          jogador.vitorias
                                        }
                                      </td>

                                      <td className="px-4 py-4 text-center text-blue-300">
                                        {
                                          jogador.selecoes_semana
                                        }
                                      </td>

                                      <td className="px-4 py-4 text-center text-yellow-300">
                                        {
                                          jogador.mvps
                                        }
                                      </td>

                                      <td className="px-5 py-4 text-right">
                                        <strong className="text-2xl text-emerald-300">
                                          {
                                            jogador.pontos
                                          }
                                        </strong>
                                      </td>
                                    </>
                                  ) : (
                                    linha
                                  )}
                                </tr>
                              )
                            },
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}

export default Temporadas