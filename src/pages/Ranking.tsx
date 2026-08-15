import {
  Check,
  Goal,
  Handshake,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Sparkles,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import {
  useJogadores,
  type Jogador,
} from '../hooks/useJogadores'

export type TipoRanking =
  | 'gols'
  | 'assistencias'
  | 'vitorias'
  | 'estrelas'

type RankingProps = {
  tipo: TipoRanking
}

type ConfiguracaoRanking = {
  titulo: string
  descricao: string
  rotulo: string
  Icone: LucideIcon
  corTexto: string
  corFundo: string
}

type AvatarJogadorProps = {
  jogador: Jogador
  tamanho?: 'sm' | 'md' | 'lg'
}

const configuracoes: Record<
  TipoRanking,
  ConfiguracaoRanking
> = {
  gols: {
    titulo: 'Ranking de gols',
    descricao:
      'Confira os maiores artilheiros do campeonato.',
    rotulo: 'Gols',
    Icone: Goal,
    corTexto: 'text-emerald-400',
    corFundo: 'bg-emerald-500/10',
  },

  assistencias: {
    titulo: 'Ranking de assistências',
    descricao:
      'Confira os jogadores com mais assistências.',
    rotulo: 'Assistências',
    Icone: Handshake,
    corTexto: 'text-purple-400',
    corFundo: 'bg-purple-500/10',
  },

  vitorias: {
    titulo: 'Ranking de vitórias',
    descricao:
      'Confira os jogadores com mais vitórias.',
    rotulo: 'Vitórias',
    Icone: Trophy,
    corTexto: 'text-amber-400',
    corFundo: 'bg-amber-500/10',
  },

  estrelas: {
    titulo: 'Divisões por estrelas',
    descricao:
      'Confira os jogadores agrupados pelo nível de destaque recebido.',
    rotulo: 'Estrelas',
    Icone: Star,
    corTexto: 'text-yellow-400',
    corFundo: 'bg-yellow-500/10',
  },
}

const divisoes = [
  {
    estrelas: 5,
    titulo: 'Divisão 5 estrelas',
    descricao: 'Nível máximo de destaque',
    classe:
      'border-yellow-400/30 bg-yellow-400/5',
    classeCabecalho:
      'bg-yellow-400/10 text-yellow-300',
  },
  {
    estrelas: 4,
    titulo: 'Divisão 4 estrelas',
    descricao: 'Destaque de excelência',
    classe:
      'border-amber-400/30 bg-amber-400/5',
    classeCabecalho:
      'bg-amber-400/10 text-amber-300',
  },
  {
    estrelas: 3,
    titulo: 'Divisão 3 estrelas',
    descricao: 'Destaque consistente',
    classe:
      'border-orange-400/30 bg-orange-400/5',
    classeCabecalho:
      'bg-orange-400/10 text-orange-300',
  },
  {
    estrelas: 2,
    titulo: 'Divisão 2 estrelas',
    descricao: 'Bom nível de destaque',
    classe:
      'border-sky-400/30 bg-sky-400/5',
    classeCabecalho:
      'bg-sky-400/10 text-sky-300',
  },
  {
    estrelas: 1,
    titulo: 'Divisão 1 estrela',
    descricao: 'Jogadores em destaque',
    classe:
      'border-slate-500/30 bg-slate-500/5',
    classeCabecalho:
      'bg-slate-500/10 text-slate-300',
  },
] as const

function AvatarJogador({
  jogador,
  tamanho = 'md',
}: AvatarJogadorProps) {
  const classeTamanho =
    tamanho === 'sm'
      ? 'h-9 w-9 text-sm'
      : tamanho === 'lg'
        ? 'h-14 w-14 text-lg'
        : 'h-10 w-10 text-base'

  if (jogador.foto_url) {
    return (
      <img
        src={jogador.foto_url}
        alt={`Foto de ${jogador.nome}`}
        loading="lazy"
        className={`${classeTamanho} shrink-0 rounded-full border border-slate-700 object-cover`}
      />
    )
  }

  return (
    <div
      className={`${classeTamanho} flex shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-slate-300 transition group-hover:bg-emerald-500/10 group-hover:text-emerald-400`}
    >
      {jogador.nome
        .charAt(0)
        .toUpperCase()}
    </div>
  )
}

function NomeJogador({
  jogador,
}: {
  jogador: Jogador
}) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-white transition group-hover:text-emerald-400">
        {jogador.apelido || jogador.nome}
      </p>

      {jogador.apelido && (
        <p className="truncate text-xs text-slate-500">
          {jogador.nome}
        </p>
      )}
    </div>
  )
}

function estiloPosicao(posicao: number) {
  if (posicao === 1) {
    return 'border border-amber-500/30 bg-amber-500/15 text-amber-400'
  }

  if (posicao === 2) {
    return 'border border-slate-400/30 bg-slate-400/10 text-slate-200'
  }

  if (posicao === 3) {
    return 'border border-orange-600/30 bg-orange-600/15 text-orange-400'
  }

  return 'border border-slate-700 bg-slate-800 text-slate-500'
}

type TimeSorteado = {
  numero: number
  jogadores: Jogador[]
  totalEstrelas: number
}

function embaralhar<T>(
  itens: T[],
) {
  const copia = [...itens]

  for (
    let indice = copia.length - 1;
    indice > 0;
    indice -= 1
  ) {
    const outroIndice =
      Math.floor(
        Math.random() *
          (indice + 1),
      )

    ;[
      copia[indice],
      copia[outroIndice],
    ] = [
      copia[outroIndice],
      copia[indice],
    ]
  }

  return copia
}

function pontuacaoEquilibrio(
  times: TimeSorteado[],
) {
  const totais = times.map(
    (time) => time.totalEstrelas,
  )

  const maior = Math.max(...totais)
  const menor = Math.min(...totais)

  const media =
    totais.reduce(
      (soma, total) =>
        soma + total,
      0,
    ) / totais.length

  const variancia =
    totais.reduce(
      (soma, total) =>
        soma +
        (total - media) ** 2,
      0,
    ) / totais.length

  /*
   * A diferença entre o time mais forte e o mais fraco
   * tem prioridade. A variância desempata combinações
   * com a mesma diferença máxima.
   */
  return (
    (maior - menor) *
      10000 +
    variancia
  )
}

function montarTimesEquilibrados(
  jogadores: Jogador[],
  quantidadeTimes: number,
) {
  if (
    quantidadeTimes < 2 ||
    jogadores.length <
      quantidadeTimes
  ) {
    return []
  }

  const tamanhoBase =
    Math.floor(
      jogadores.length /
        quantidadeTimes,
    )

  const excedentes =
    jogadores.length %
    quantidadeTimes

  let melhorTimes:
    | TimeSorteado[]
    | null = null

  let melhorPontuacao =
    Number.POSITIVE_INFINITY

  /*
   * Faz várias tentativas alterando a distribuição
   * entre jogadores de força semelhante e guarda a
   * combinação mais equilibrada encontrada.
   *
   * Depois de cada distribuição, tenta trocas entre
   * jogadores de times diferentes para reduzir ainda
   * mais a diferença de estrelas.
   */
  for (
    let tentativa = 0;
    tentativa < 700;
    tentativa += 1
  ) {
    const capacidades =
      embaralhar(
        Array.from(
          {
            length:
              quantidadeTimes,
          },
          (_, indice) =>
            tamanhoBase +
            (indice < excedentes
              ? 1
              : 0),
        ),
      )

    const jogadoresOrdenados =
      embaralhar(jogadores)
        .map((jogador) => ({
          jogador,
          desempate:
            Math.random(),
        }))
        .sort(
          (a, b) =>
            b.jogador.estrelas -
              a.jogador.estrelas ||
            a.desempate -
              b.desempate,
        )
        .map(
          ({ jogador }) =>
            jogador,
        )

    let times: TimeSorteado[] =
      Array.from(
        {
          length:
            quantidadeTimes,
        },
        (_, indice) => ({
          numero: indice + 1,
          jogadores: [],
          totalEstrelas: 0,
        }),
      )

    for (
      const jogador of
      jogadoresOrdenados
    ) {
      const candidatos =
        times
          .map(
            (time, indice) => ({
              time,
              indice,
            }),
          )
          .filter(
            ({ time, indice }) =>
              time.jogadores.length <
              capacidades[indice],
          )
          .sort(
            (a, b) =>
              a.time
                .totalEstrelas -
                b.time
                  .totalEstrelas ||
              a.time.jogadores
                .length -
                b.time.jogadores
                  .length ||
              Math.random() -
                0.5,
          )

      const escolhido =
        candidatos[0]

      if (!escolhido) {
        continue
      }

      escolhido.time.jogadores.push(
        jogador,
      )

      escolhido.time.totalEstrelas +=
        jogador.estrelas
    }

    let melhorou = true
    let ciclos = 0

    while (
      melhorou &&
      ciclos < 30
    ) {
      melhorou = false
      ciclos += 1

      const pontuacaoAtual =
        pontuacaoEquilibrio(
          times,
        )

      outer: for (
        let primeiroTime = 0;
        primeiroTime <
        times.length;
        primeiroTime += 1
      ) {
        for (
          let segundoTime =
            primeiroTime + 1;
          segundoTime <
          times.length;
          segundoTime += 1
        ) {
          for (
            let primeiroJogador = 0;
            primeiroJogador <
            times[primeiroTime]
              .jogadores.length;
            primeiroJogador += 1
          ) {
            for (
              let segundoJogador = 0;
              segundoJogador <
              times[segundoTime]
                .jogadores.length;
              segundoJogador += 1
            ) {
              const jogadorA =
                times[
                  primeiroTime
                ].jogadores[
                  primeiroJogador
                ]

              const jogadorB =
                times[
                  segundoTime
                ].jogadores[
                  segundoJogador
                ]

              if (
                jogadorA.estrelas ===
                jogadorB.estrelas
              ) {
                continue
              }

              const copia =
                times.map(
                  (time) => ({
                    ...time,
                    jogadores: [
                      ...time.jogadores,
                    ],
                  }),
                )

              copia[
                primeiroTime
              ].jogadores[
                primeiroJogador
              ] = jogadorB

              copia[
                segundoTime
              ].jogadores[
                segundoJogador
              ] = jogadorA

              copia[
                primeiroTime
              ].totalEstrelas =
                copia[
                  primeiroTime
                ].jogadores.reduce(
                  (soma, item) =>
                    soma +
                    item.estrelas,
                  0,
                )

              copia[
                segundoTime
              ].totalEstrelas =
                copia[
                  segundoTime
                ].jogadores.reduce(
                  (soma, item) =>
                    soma +
                    item.estrelas,
                  0,
                )

              const novaPontuacao =
                pontuacaoEquilibrio(
                  copia,
                )

              if (
                novaPontuacao <
                pontuacaoAtual
              ) {
                times = copia
                melhorou = true
                break outer
              }
            }
          }
        }
      }
    }

    const pontuacao =
      pontuacaoEquilibrio(
        times,
      )

    if (
      pontuacao <
      melhorPontuacao
    ) {
      melhorPontuacao =
        pontuacao

      melhorTimes =
        times.map(
          (time, indice) => ({
            ...time,
            numero:
              indice + 1,
            jogadores:
              [...time.jogadores].sort(
                (a, b) =>
                  b.estrelas -
                    a.estrelas ||
                  (
                    a.apelido ||
                    a.nome
                  ).localeCompare(
                    b.apelido ||
                      b.nome,
                    'pt-BR',
                  ),
              ),
          }),
        )
    }

    /*
     * Diferença zero já é equilíbrio perfeito;
     * não há por que continuar procurando.
     */
    if (
      melhorTimes &&
      pontuacaoEquilibrio(
        melhorTimes,
      ) === 0
    ) {
      break
    }
  }

  return melhorTimes ?? []
}

function estrelasCompactas(
  quantidade: number,
) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-yellow-400"
      aria-label={`${quantidade} estrelas`}
    >
      {Array.from({
        length: quantidade,
      }).map((_, indice) => (
        <Star
          key={indice}
          size={13}
          fill="currentColor"
        />
      ))}
    </span>
  )
}

function SorteadorTimes({
  jogadores,
}: {
  jogadores: Jogador[]
}) {
  const [
    jogadoresSelecionados,
    setJogadoresSelecionados,
  ] = useState<number[]>([])

  const [
    quantidadeTimes,
    setQuantidadeTimes,
  ] = useState(4)

  const [times, setTimes] =
    useState<TimeSorteado[]>(
      [],
    )

  const [mensagem, setMensagem] =
    useState('')

  const limiteJogadores =
    quantidadeTimes === 3
      ? 12
      : 16

  const jogadoresAvaliados =
    useMemo(
      () =>
        [...jogadores]
          .filter(
            (jogador) =>
              jogador.estrelas > 0,
          )
          .sort((a, b) =>
            (
              a.apelido ||
              a.nome
            ).localeCompare(
              b.apelido ||
                b.nome,
              'pt-BR',
            ),
          ),
      [jogadores],
    )

  const selecionados =
    useMemo(() => {
      const ids =
        new Set(
          jogadoresSelecionados,
        )

      return jogadoresAvaliados.filter(
        (jogador) =>
          ids.has(jogador.id),
      )
    }, [
      jogadoresAvaliados,
      jogadoresSelecionados,
    ])

  const quantidadeMaximaSelecionavel =
    Math.min(
      jogadoresAvaliados.length,
      limiteJogadores,
    )

  const todosSelecionados =
    quantidadeMaximaSelecionavel >
      0 &&
    jogadoresSelecionados.length ===
      quantidadeMaximaSelecionavel

  function alternarJogador(
    jogadorId: number,
  ) {
    const jaSelecionado =
      jogadoresSelecionados.includes(
        jogadorId,
      )

    if (
      !jaSelecionado &&
      jogadoresSelecionados.length >=
        limiteJogadores
    ) {
      setMensagem(
        quantidadeTimes === 3
          ? 'Para 3 times, são necessários exatamente 12 jogadores.'
          : 'Para 4 times, são necessários exatamente 16 jogadores.',
      )

      return
    }

    setJogadoresSelecionados(
      (atuais) =>
        atuais.includes(
          jogadorId,
        )
          ? atuais.filter(
              (id) =>
                id !==
                jogadorId,
            )
          : [
              ...atuais,
              jogadorId,
            ],
    )

    setTimes([])
    setMensagem('')
  }

  function alternarTodos() {
    if (todosSelecionados) {
      setJogadoresSelecionados(
        [],
      )
    } else {
      setJogadoresSelecionados(
        jogadoresAvaliados
          .slice(
            0,
            limiteJogadores,
          )
          .map(
            (jogador) =>
              jogador.id,
          ),
      )
    }

    setTimes([])
    setMensagem('')
  }

  function sortearTimes() {
    const quantidadeNecessaria =
      quantidadeTimes === 3
        ? 12
        : 16

    if (
      selecionados.length !==
      quantidadeNecessaria
    ) {
      setMensagem(
        quantidadeTimes === 3
          ? 'Selecione exatamente 12 jogadores para montar 3 times.'
          : 'Selecione exatamente 16 jogadores para montar 4 times.',
      )
      return
    }

    const resultado =
      montarTimesEquilibrados(
        selecionados,
        quantidadeTimes,
      )

    if (
      resultado.length === 0
    ) {
      setMensagem(
        'Não foi possível montar os times com esta configuração.',
      )
      return
    }

    setTimes(resultado)
    setMensagem('')
  }

  const totais =
    times.map(
      (time) =>
        time.totalEstrelas,
    )

  const diferenca =
    totais.length > 0
      ? Math.max(...totais) -
        Math.min(...totais)
      : 0

  const qualidade =
    diferenca === 0
      ? 'Perfeito'
      : diferenca === 1
        ? 'Excelente'
        : diferenca === 2
          ? 'Bom'
          : 'Melhor equilíbrio encontrado'

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900">
      <header className="border-b border-slate-800 bg-emerald-500/5 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Shuffle size={22} />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-400">
                Formação do racha
              </p>

              <h3 className="mt-1 text-xl font-black text-white">
                Montar times equilibrados
              </h3>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                Selecione quem vai jogar. Para montar 3 times, escolha 12 jogadores. Para montar 4 times, escolha 16 jogadores. O sistema usa as estrelas para procurar a divisão com a menor diferença de força possível.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
            <Users
              size={17}
              className="text-slate-400"
            />

            <span className="text-sm text-slate-400">
              Selecionados:
            </span>

            <strong className="text-emerald-300">
              {selecionados.length}/
              {limiteJogadores}
            </strong>
          </div>
        </div>
      </header>

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <label
              htmlFor="quantidade-times"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              Quantidade de times
            </label>

            <select
              id="quantidade-times"
              value={quantidadeTimes}
              onChange={(event) => {
                const novaQuantidade =
                  Number(
                    event.target.value,
                  )

                const novoLimite =
                  novaQuantidade === 3
                    ? 12
                    : 16

                setQuantidadeTimes(
                  novaQuantidade,
                )

                setJogadoresSelecionados(
                  (atuais) =>
                    atuais.slice(
                      0,
                      novoLimite,
                    ),
                )

                setTimes([])

                setMensagem(
                  jogadoresSelecionados.length >
                    novoLimite
                    ? `A seleção foi ajustada para ${novoLimite} jogadores.`
                    : '',
                )
              }}
              className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 font-bold text-white outline-none transition focus:border-emerald-500"
            >
              <option value={3}>
                3 times
              </option>

              <option value={4}>
                4 times
              </option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={alternarTodos}
              disabled={
                jogadoresAvaliados.length ===
                0
              }
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {todosSelecionados
                ? 'Desmarcar todos'
                : 'Selecionar todos'}
            </button>

            <button
              type="button"
              onClick={sortearTimes}
              disabled={
                selecionados.length !==
                limiteJogadores
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Shuffle size={17} />
              {times.length > 0
                ? 'Sortear novamente'
                : selecionados.length ===
                    limiteJogadores
                  ? 'Montar times'
                  : `Selecione ${limiteJogadores}`}

            </button>
          </div>
        </div>

        {jogadoresAvaliados.length ===
        0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
            <Star
              size={28}
              className="mx-auto text-slate-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Ainda não há jogadores com estrelas definidas.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {jogadoresAvaliados.map(
                (jogador) => {
                  const selecionado =
                    jogadoresSelecionados.includes(
                      jogador.id,
                    )

                  return (
                    <button
                      type="button"
                      key={
                        jogador.id
                      }
                      onClick={() =>
                        alternarJogador(
                          jogador.id,
                        )
                      }
                      className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        selecionado
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          selecionado
                            ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                            : 'border-slate-600 bg-slate-900'
                        }`}
                      >
                        {selecionado && (
                          <Check
                            size={13}
                            strokeWidth={
                              3
                            }
                          />
                        )}
                      </span>

                      <AvatarJogador
                        jogador={
                          jogador
                        }
                        tamanho="sm"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">
                          {jogador.apelido ||
                            jogador.nome}
                        </p>

                        {jogador.apelido && (
                          <p className="truncate text-[11px] text-slate-500">
                            {
                              jogador.nome
                            }
                          </p>
                        )}

                        <div className="mt-1">
                          {estrelasCompactas(
                            jogador.estrelas,
                          )}
                        </div>
                      </div>
                    </button>
                  )
                },
              )}
            </div>

            {jogadores.length >
              jogadoresAvaliados.length && (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Jogadores sem estrelas ainda não entram no sorteio. Defina o nível deles na administração para incluí-los.
              </p>
            )}
          </>
        )}

        {mensagem && (
          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            {mensagem}
          </div>
        )}

        {times.length > 0 && (
          <div className="mt-7 border-t border-slate-800 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles
                    size={18}
                  />

                  <p className="text-sm font-semibold">
                    Resultado
                  </p>
                </div>

                <h4 className="mt-1 text-xl font-black">
                  Times do racha
                </h4>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm">
                <span className="text-slate-400">
                  Equilíbrio:{' '}
                </span>

                <strong className="text-emerald-300">
                  {qualidade}
                </strong>

                <span className="ml-2 text-slate-500">
                  · diferença{' '}
                  {diferenca}{' '}
                  {diferenca === 1
                    ? 'estrela'
                    : 'estrelas'}
                </span>
              </div>
            </div>

            <div
              className={`mt-5 grid gap-4 ${
                times.length === 2
                  ? 'md:grid-cols-2'
                  : times.length === 3
                    ? 'md:grid-cols-3'
                    : 'md:grid-cols-2 xl:grid-cols-4'
              }`}
            >
              {times.map(
                (time) => (
                  <article
                    key={
                      time.numero
                    }
                    className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/50"
                  >
                    <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          Equipe
                        </p>

                        <h5 className="font-black text-white">
                          Time{' '}
                          {
                            time.numero
                          }
                        </h5>
                      </div>

                      <div className="text-right">
                        <strong className="text-xl text-yellow-300">
                          {
                            time.totalEstrelas
                          }
                        </strong>

                        <p className="text-[10px] uppercase tracking-wider text-slate-500">
                          estrelas
                        </p>
                      </div>
                    </header>

                    <div className="divide-y divide-slate-800">
                      {time.jogadores.map(
                        (
                          jogador,
                        ) => (
                          <Link
                            key={
                              jogador.id
                            }
                            to={`/jogador/${jogador.id}`}
                            className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-800/60"
                          >
                            <AvatarJogador
                              jogador={
                                jogador
                              }
                              tamanho="sm"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-white transition group-hover:text-emerald-300">
                                {jogador.apelido ||
                                  jogador.nome}
                              </p>

                              <div className="mt-1">
                                {estrelasCompactas(
                                  jogador.estrelas,
                                )}
                              </div>
                            </div>

                            <span className="text-xs font-black text-yellow-300">
                              {
                                jogador.estrelas
                              }
                              ★
                            </span>
                          </Link>
                        ),
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                A quantidade de jogadores por time fica igual ou difere no máximo em 1 quando o total não é divisível exatamente.
              </p>

              <button
                type="button"
                onClick={sortearTimes}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                <RotateCcw
                  size={15}
                />
                Nova combinação
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function RankingEstrelas({
  jogadores,
  ehAdmin,
}: {
  jogadores: Jogador[]
  ehAdmin: boolean
}) {
  return (
    <>
      {ehAdmin && (
        <SorteadorTimes
          jogadores={jogadores}
        />
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        {divisoes.map((divisao, indice) => {
          const jogadoresDaDivisao =
            jogadores
              .filter(
                (jogador) =>
                  jogador.estrelas ===
                  divisao.estrelas,
              )
              .sort((a, b) =>
                (a.apelido || a.nome).localeCompare(
                  b.apelido || b.nome,
                  'pt-BR',
                ),
              )

          const ultimaDivisao =
            indice === divisoes.length - 1

          return (
            <article
              key={divisao.estrelas}
              className={`overflow-hidden rounded-2xl border ${divisao.classe} ${
                ultimaDivisao
                  ? 'xl:col-span-2'
                  : ''
              }`}
            >
              <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {divisao.titulo}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {divisao.descricao}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({
                      length: divisao.estrelas,
                    }).map((_, estrela) => (
                      <Star
                        key={estrela}
                        size={18}
                        fill="currentColor"
                        className="text-yellow-400"
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${divisao.classeCabecalho}`}
                  >
                    {jogadoresDaDivisao.length}{' '}
                    {jogadoresDaDivisao.length === 1
                      ? 'jogador'
                      : 'jogadores'}
                  </span>

                  <span className="text-xs text-slate-500">
                    Clique para ver o perfil
                  </span>
                </div>
              </header>

              {jogadoresDaDivisao.length > 0 ? (
                <div className="divide-y divide-slate-800 bg-slate-900">
                  {jogadoresDaDivisao.map(
                    (jogador) => (
                      <Link
                        key={jogador.id}
                        to={`/jogador/${jogador.id}`}
                        title={`Ver perfil de ${jogador.nome}`}
                        className="group flex items-center gap-3 px-5 py-4 transition hover:bg-slate-800/60"
                      >
                        <AvatarJogador
                          jogador={jogador}
                        />

                        <NomeJogador
                          jogador={jogador}
                        />

                        <div className="ml-auto flex shrink-0 items-center gap-1">
                          {Array.from({
                            length: jogador.estrelas,
                          }).map(
                            (_, estrela) => (
                              <Star
                                key={estrela}
                                size={15}
                                fill="currentColor"
                                className="text-yellow-400"
                              />
                            ),
                          )}
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 px-5 py-8 text-center text-sm text-slate-500">
                  Nenhum jogador nesta divisão.
                </div>
              )}
            </article>
          )
        })}
      </section>
    </>
  )
}

function Ranking({ tipo }: RankingProps) {
  const {
    jogadores,
    carregando,
    erro,
    recarregar,
  } = useJogadores()

  const { perfil } = useAuth()

  const ehAdmin =
    perfil?.tipo === 'admin'

  const configuracao = configuracoes[tipo]
  const { Icone } = configuracao

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <h2 className="mt-5 text-xl font-bold">
              Carregando ranking
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Buscando os jogadores no Supabase...
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
          <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
            <h2 className="text-xl font-bold text-red-300">
              Erro ao carregar o ranking
            </h2>

            <p className="mt-2 text-sm text-red-200/70">
              {erro}
            </p>

            <button
              type="button"
              onClick={recarregar}
              className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <RefreshCw size={18} />
              Tentar novamente
            </button>
          </section>
        </main>
      </div>
    )
  }

  const jogadoresOrdenados =
    tipo === 'estrelas'
      ? []
      : [...jogadores].sort(
          (primeiro, segundo) => {
            const diferenca =
              segundo[tipo] - primeiro[tipo]

            if (diferenca !== 0) {
              return diferenca
            }

            return (
              primeiro.apelido ||
              primeiro.nome
            ).localeCompare(
              segundo.apelido ||
                segundo.nome,
              'pt-BR',
            )
          },
        )

  const lider = jogadoresOrdenados[0]

  function classeValor(
    campo: TipoRanking,
  ) {
    if (campo === tipo) {
      return `font-bold ${configuracao.corTexto}`
    }

    return 'text-slate-300'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        <section className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${configuracao.corFundo} ${configuracao.corTexto}`}
            >
              <Icone size={28} />
            </div>

            <p
              className={`text-sm font-medium ${configuracao.corTexto}`}
            >
              Classificação
            </p>

            <h2 className="mt-1 text-3xl font-bold">
              {configuracao.titulo}
            </h2>

            <p className="mt-2 text-slate-400">
              {configuracao.descricao}
            </p>
          </div>

          {tipo !== 'estrelas' &&
            lider && (
              <Link
                to={`/jogador/${lider.id}`}
                title={`Ver perfil de ${lider.nome}`}
                className="group flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 transition hover:border-emerald-500/30 hover:bg-slate-800/60 sm:gap-4 sm:px-5 md:w-auto"
              >
                <AvatarJogador
                  jogador={lider}
                  tamanho="lg"
                />

                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Líder atual
                  </p>

                  <NomeJogador
                    jogador={lider}
                  />
                </div>

                <div className="ml-2 border-l border-slate-700 pl-4">
                  <p
                    className={`text-2xl font-bold ${configuracao.corTexto}`}
                  >
                    {lider[tipo]}
                  </p>

                  <p className="text-xs text-slate-500">
                    {configuracao.rotulo}
                  </p>
                </div>
              </Link>
            )}
        </section>

        {tipo === 'estrelas' ? (
          <RankingEstrelas
            jogadores={jogadores}
            ehAdmin={ehAdmin}
          />
        ) : (
          <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  Classificação completa
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Ordenação do maior para o menor.
                </p>
              </div>

              <button
                type="button"
                onClick={recarregar}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                <RefreshCw size={17} />
                Atualizar
              </button>
            </div>

            {/* MOBILE: cards no lugar da tabela */}
            <div className="space-y-3 p-4 md:hidden">
              {jogadoresOrdenados.length > 0 ? (
                jogadoresOrdenados.map(
                  (jogador, indice) => {
                    const posicao = indice + 1

                    return (
                      <Link
                        key={jogador.id}
                        to={`/jogador/${jogador.id}`}
                        title={`Ver perfil de ${jogador.nome}`}
                        className="group block rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-emerald-500/30 hover:bg-slate-800/70 active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl px-2 text-sm font-bold ${estiloPosicao(
                              posicao,
                            )}`}
                          >
                            {posicao}º
                          </span>

                          <AvatarJogador
                            jogador={jogador}
                          />

                          <div className="min-w-0 flex-1">
                            <NomeJogador
                              jogador={jogador}
                            />

                            <p className="mt-1 text-[11px] text-slate-600">
                              Toque para ver o perfil
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                              {configuracao.rotulo}
                            </p>

                            <p
                              className={`mt-0.5 text-2xl font-bold ${configuracao.corTexto}`}
                            >
                              {jogador[tipo]}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-800 pt-4">
                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-wide text-slate-600">
                              Gols
                            </p>

                            <p
                              className={`mt-1 text-sm ${classeValor(
                                'gols',
                              )}`}
                            >
                              {jogador.gols}
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-wide text-slate-600">
                              Assist.
                            </p>

                            <p
                              className={`mt-1 text-sm ${classeValor(
                                'assistencias',
                              )}`}
                            >
                              {jogador.assistencias}
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-wide text-slate-600">
                              Vitórias
                            </p>

                            <p
                              className={`mt-1 text-sm ${classeValor(
                                'vitorias',
                              )}`}
                            >
                              {jogador.vitorias}
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-wide text-slate-600">
                              Estrelas
                            </p>

                            <p
                              className={`mt-1 inline-flex items-center justify-center gap-1 text-sm ${classeValor(
                                'estrelas',
                              )}`}
                            >
                              <Star
                                size={13}
                                fill="currentColor"
                              />
                              {jogador.estrelas}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  },
                )
              ) : (
                <div className="px-4 py-10 text-center text-slate-400">
                  Nenhum jogador cadastrado.
                </div>
              )}
            </div>

            {/* DESKTOP/TABLET: mantém a tabela */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      Posição
                    </th>

                    <th className="px-6 py-4">
                      Jogador
                    </th>

                    <th className="px-6 py-4 text-center">
                      Gols
                    </th>

                    <th className="px-6 py-4 text-center">
                      Assistências
                    </th>

                    <th className="px-6 py-4 text-center">
                      Vitórias
                    </th>

                    <th className="px-6 py-4 text-center">
                      Estrelas
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {jogadoresOrdenados.length >
                  0 ? (
                    jogadoresOrdenados.map(
                      (
                        jogador,
                        indice,
                      ) => {
                        const posicao =
                          indice + 1

                        return (
                          <tr
                            key={jogador.id}
                            className="transition hover:bg-slate-800/50"
                          >
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-bold ${estiloPosicao(
                                  posicao,
                                )}`}
                              >
                                {posicao}º
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <Link
                                to={`/jogador/${jogador.id}`}
                                title={`Ver perfil de ${jogador.nome}`}
                                className="group inline-flex items-center gap-3"
                              >
                                <AvatarJogador
                                  jogador={
                                    jogador
                                  }
                                />

                                <NomeJogador
                                  jogador={
                                    jogador
                                  }
                                />
                              </Link>
                            </td>

                            <td
                              className={`px-6 py-4 text-center ${classeValor(
                                'gols',
                              )}`}
                            >
                              {jogador.gols}
                            </td>

                            <td
                              className={`px-6 py-4 text-center ${classeValor(
                                'assistencias',
                              )}`}
                            >
                              {
                                jogador.assistencias
                              }
                            </td>

                            <td
                              className={`px-6 py-4 text-center ${classeValor(
                                'vitorias',
                              )}`}
                            >
                              {
                                jogador.vitorias
                              }
                            </td>

                            <td
                              className={`px-6 py-4 text-center ${classeValor(
                                'estrelas',
                              )}`}
                            >
                              <span className="inline-flex items-center justify-center gap-1">
                                <Star
                                  size={15}
                                  fill="currentColor"
                                />
                                {
                                  jogador.estrelas
                                }
                              </span>
                            </td>
                          </tr>
                        )
                      },
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        Nenhum jogador
                        cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        )}
      </main>
    </div>
  )
}

export default Ranking