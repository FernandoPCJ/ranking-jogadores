import {
  AlertCircle,
  ArrowLeft,
  Crown,
  Goal,
  Handshake,
  Medal,
  RefreshCw,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useParams,
} from 'react-router'
import Header from '../components/Header'
import { supabase } from '../lib/supabase'
import {
  calcularOverall,
  obterNivelCard,
  type NivelCard,
} from '../utils/overall'

type PerfilPublico = {
  jogador_id: number
  nome: string
  apelido: string | null
  bio: string | null
  foto_url: string | null

  gols: number
  assistencias: number
  vitorias: number
  estrelas: number

  posicao: string | null
  pe_dominante: string | null

  pac: number | null
  sho: number | null
  pas: number | null
  dri: number | null
  def: number | null
  phy: number | null

  card_configurado: boolean

  selecoes_semana: number
  mvps: number
}

type JogadorRanking = {
  id: number
  nome: string
  gols: number
  assistencias: number
  vitorias: number
}

type CampoRanking =
  | 'gols'
  | 'assistencias'
  | 'vitorias'

type PosicoesRanking = {
  gols: number | null
  assistencias: number | null
  vitorias: number | null
}

type TemaCard = {
  nome: string
  descricao: string
  card: string
  numero: string
  foto: string
  selo: string
  divisoria: string
  textoSecundario: string
}

const TEMAS_CARD: Record<
  NivelCard,
  TemaCard
> = {
  bronze: {
    nome: 'BRONZE',
    descricao: '50–69 OVR',
    card:
      'border-amber-700/70 bg-gradient-to-br from-amber-950 via-stone-900 to-slate-950 text-white shadow-amber-950/30',
    numero: 'text-amber-400',
    foto: 'border-amber-700/50',
    selo:
      'border-amber-700/30 bg-amber-700/10 text-amber-300',
    divisoria: 'border-white/10',
    textoSecundario: 'text-slate-400',
  },

  prata: {
    nome: 'PRATA',
    descricao: '70–79 OVR',
    card:
      'border-slate-300/60 bg-gradient-to-br from-slate-500 via-slate-800 to-slate-950 text-white shadow-slate-400/20',
    numero: 'text-slate-100',
    foto: 'border-slate-300/60',
    selo:
      'border-slate-300/30 bg-white/10 text-slate-100',
    divisoria: 'border-white/10',
    textoSecundario: 'text-slate-300',
  },

  ouro: {
    nome: 'OURO',
    descricao: '80–89 OVR',
    card:
      'border-yellow-400/70 bg-gradient-to-br from-yellow-800 via-amber-950 to-slate-950 text-white shadow-yellow-900/30',
    numero: 'text-yellow-300',
    foto: 'border-yellow-400/60',
    selo:
      'border-yellow-300/30 bg-yellow-400/10 text-yellow-300',
    divisoria: 'border-white/10',
    textoSecundario: 'text-amber-100/70',
  },

  legend: {
    nome: 'LEGEND',
    descricao: '90+ OVR',
    card:
      'border-yellow-500/80 bg-gradient-to-br from-stone-50 via-white to-amber-50 text-slate-950 shadow-yellow-400/25',
    numero: 'text-amber-700',
    foto: 'border-amber-500/70',
    selo:
      'border-amber-500/40 bg-amber-100 text-amber-800',
    divisoria: 'border-slate-900/10',
    textoSecundario: 'text-slate-600',
  },
}

function calcularPosicao(
  jogadores: JogadorRanking[],
  jogadorId: number,
  campo: CampoRanking,
) {
  const ordenados = [...jogadores].sort(
    (jogadorA, jogadorB) => {
      const diferenca =
        jogadorB[campo] - jogadorA[campo]

      if (diferenca !== 0) {
        return diferenca
      }

      return jogadorA.nome.localeCompare(
        jogadorB.nome,
        'pt-BR',
      )
    },
  )

  const indice = ordenados.findIndex(
    (jogador) => jogador.id === jogadorId,
  )

  return indice >= 0
    ? indice + 1
    : null
}

function classeRanking(
  posicao: number | null,
) {
  if (posicao === 1) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  }

  if (posicao === 2) {
    return 'border-slate-400/30 bg-slate-400/10 text-slate-200'
  }

  if (posicao === 3) {
    return 'border-orange-600/30 bg-orange-600/10 text-orange-400'
  }

  return 'border-slate-700 bg-slate-800/60 text-slate-400'
}

function textoRanking(
  posicao: number | null,
) {
  if (!posicao) {
    return 'Sem posição'
  }

  return `${posicao}º no ranking`
}

function PerfilJogador() {
  const { id } = useParams()

  const [perfil, setPerfil] =
    useState<PerfilPublico | null>(
      null,
    )

  const [posicoes, setPosicoes] =
    useState<PosicoesRanking>({
      gols: null,
      assistencias: null,
      vitorias: null,
    })

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] =
    useState('')

  const carregarPerfil =
    useCallback(async () => {
      const jogadorId = Number(id)

      if (
        !Number.isInteger(
          jogadorId,
        ) ||
        jogadorId <= 0
      ) {
        setPerfil(null)
        setErro('Jogador inválido.')
        setCarregando(false)
        return
      }

      setCarregando(true)
      setErro('')

      const [
        {
          data: dadosPerfil,
          error: erroPerfil,
        },
        {
          data: dadosRanking,
          error: erroRanking,
        },
      ] = await Promise.all([
        supabase.rpc(
          'obter_perfil_publico',
          {
            p_jogador_id:
              jogadorId,
          },
        ),

        supabase
          .from('jogadores')
          .select(
            `
              id,
              nome,
              gols,
              assistencias,
              vitorias
            `,
          )
          .eq('ativo', true),
      ])

      if (erroPerfil) {
        console.error(
          'Erro ao carregar perfil público:',
          erroPerfil,
        )

        setPerfil(null)

        setErro(
          'Não foi possível carregar o perfil do jogador.',
        )

        setCarregando(false)
        return
      }

      if (!dadosPerfil) {
        setPerfil(null)

        setErro(
          'Jogador não encontrado ou indisponível.',
        )

        setCarregando(false)
        return
      }

      const perfilCarregado =
        dadosPerfil as PerfilPublico

      setPerfil(perfilCarregado)

      if (erroRanking) {
        console.error(
          'Erro ao calcular posições:',
          erroRanking,
        )

        setPosicoes({
          gols: null,
          assistencias: null,
          vitorias: null,
        })
      } else {
        const jogadores =
          (
            dadosRanking as
              | JogadorRanking[]
              | null
          ) ?? []

        setPosicoes({
          gols: calcularPosicao(
            jogadores,
            jogadorId,
            'gols',
          ),

          assistencias:
            calcularPosicao(
              jogadores,
              jogadorId,
              'assistencias',
            ),

          vitorias:
            calcularPosicao(
              jogadores,
              jogadorId,
              'vitorias',
            ),
        })
      }

      setCarregando(false)
    }, [id])

  useEffect(() => {
    carregarPerfil()
  }, [carregarPerfil])

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <p className="mt-4 text-sm text-slate-400">
              Carregando perfil do jogador...
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-8">
          <Link
            to="/inicio"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Voltar ao dashboard
          </Link>

          <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
            <AlertCircle
              size={34}
              className="mx-auto text-red-400"
            />

            <h2 className="mt-4 text-xl font-bold">
              Perfil não encontrado
            </h2>

            <p className="mt-2 text-sm text-red-200/70">
              {erro}
            </p>

            <button
              type="button"
              onClick={carregarPerfil}
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

  const nomeExibicao =
    perfil.apelido ||
    perfil.nome

  const overall =
    calcularOverall({
      posicao:
        perfil.posicao,
      pac: perfil.pac,
      sho: perfil.sho,
      pas: perfil.pas,
      dri: perfil.dri,
      def: perfil.def,
      phy: perfil.phy,
    })

  const nivel =
    obterNivelCard(overall)

  const tema =
    TEMAS_CARD[nivel]

  const atributos = [
    {
      sigla: 'PAC',
      valor: perfil.pac ?? 50,
    },
    {
      sigla: 'SHO',
      valor: perfil.sho ?? 50,
    },
    {
      sigla: 'PAS',
      valor: perfil.pas ?? 50,
    },
    {
      sigla: 'DRI',
      valor: perfil.dri ?? 50,
    },
    {
      sigla: 'DEF',
      valor: perfil.def ?? 50,
    },
    {
      sigla: 'PHY',
      valor: perfil.phy ?? 50,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-8">
        <Link
          to="/inicio"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar ao dashboard
        </Link>

        <section className="mb-8">
          <p className="text-sm font-medium text-emerald-400">
            Jogador
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            Perfil do jogador
          </h2>

          <p className="mt-2 text-slate-400">
            Card, desempenho, rankings e histórico de destaques.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="self-start rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-center">
              <div className="mx-auto h-36 w-36">
                {perfil.foto_url ? (
                  <img
                    src={
                      perfil.foto_url
                    }
                    alt={`Foto de ${nomeExibicao}`}
                    className="h-36 w-36 rounded-full border-4 border-slate-800 object-cover object-top"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-950 text-4xl font-bold text-slate-400">
                    {nomeExibicao
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <h3 className="mt-5 text-2xl font-bold">
                {nomeExibicao}
              </h3>

              {perfil.apelido && (
                <p className="mt-1 text-sm text-slate-400">
                  {perfil.nome}
                </p>
              )}

              {perfil.card_configurado ? (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    {perfil.posicao}
                  </span>

                  <span className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                    Pé {perfil.pe_dominante}
                  </span>
                </div>
              ) : (
                <span className="mt-4 inline-flex rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-500">
                  Card ainda não configurado
                </span>
              )}

              <div className="mt-5 flex flex-wrap justify-center gap-1">
                {Array.from({
                  length: 5,
                }).map(
                  (_, indice) => (
                    <Star
                      key={indice}
                      size={21}
                      fill={
                        indice <
                        perfil.estrelas
                          ? 'currentColor'
                          : 'none'
                      }
                      className={
                        indice <
                        perfil.estrelas
                          ? 'text-amber-400'
                          : 'text-slate-700'
                      }
                    />
                  ),
                )}
              </div>

              <p className="mt-2 text-sm font-medium text-amber-400">
                {perfil.estrelas === 0
                  ? 'Ainda sem divisão'
                  : perfil.estrelas ===
                      1
                    ? 'Divisão 1 estrela'
                    : `Divisão ${perfil.estrelas} estrelas`}
              </p>
            </div>

            <div className="mt-7 border-t border-slate-800 pt-6">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Bio
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {perfil.bio ||
                  'Este jogador ainda não adicionou uma bio.'}
              </p>
            </div>

            <div className="mt-7 border-t border-slate-800 pt-6">
              <div className="flex items-center gap-3">
                <UserRound
                  size={20}
                  className="text-emerald-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Jogador
                  </p>

                  <p className="font-semibold">
                    {perfil.nome}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <section>
              <div className="mb-4">
                <p className="text-sm font-medium text-emerald-400">
                  Card
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  Card do jogador
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Overall calculado pelas mesmas regras usadas no Meu Card e na Seleção da Semana.
                </p>
              </div>

              {perfil.card_configurado ? (
                <div className="grid gap-5 xl:grid-cols-[310px_1fr]">
                  <article
                    className={`relative overflow-hidden rounded-[30px] border p-5 shadow-2xl ${tema.card}`}
                  >
                    {nivel ===
                      'legend' && (
                      <>
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_34%),linear-gradient(135deg,transparent_20%,rgba(180,83,9,0.08)_21%,transparent_22%,transparent_72%,rgba(180,83,9,0.08)_73%,transparent_74%)]" />

                        <div className="pointer-events-none absolute inset-2 rounded-[24px] border border-amber-500/20" />
                      </>
                    )}

                    <div className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className={`text-5xl font-black ${tema.numero}`}
                          >
                            {overall}
                          </p>

                          <p className="mt-1 text-sm font-black">
                            {perfil.posicao}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-black tracking-widest ${tema.selo}`}
                        >
                          {nivel ===
                          'legend' ? (
                            <Crown size={12} />
                          ) : (
                            <ShieldCheck
                              size={12}
                            />
                          )}

                          {tema.nome}
                        </span>
                      </div>

                      <div className="mt-4 flex justify-center">
                        {perfil.foto_url ? (
                          <img
                            src={
                              perfil.foto_url
                            }
                            alt=""
                            className={`h-40 w-40 rounded-3xl border-2 object-cover object-top ${tema.foto}`}
                          />
                        ) : (
                          <div
                            className={`flex h-40 w-40 items-center justify-center rounded-3xl border-2 bg-slate-950/20 text-5xl font-black ${tema.foto}`}
                          >
                            {nomeExibicao
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 text-center">
                        <p className="truncate text-xl font-black uppercase">
                          {nomeExibicao}
                        </p>

                        <p
                          className={`mt-1 text-xs ${tema.textoSecundario}`}
                        >
                          Pé{' '}
                          {
                            perfil.pe_dominante
                          }
                        </p>
                      </div>

                      <div
                        className={`mt-5 grid grid-cols-3 gap-x-3 gap-y-3 border-t pt-4 ${tema.divisoria}`}
                      >
                        {atributos.map(
                          (atributo) => (
                            <div
                              key={
                                atributo.sigla
                              }
                              className="text-center"
                            >
                              <strong className="text-lg">
                                {
                                  atributo.valor
                                }
                              </strong>

                              <p
                                className={`text-[10px] font-bold tracking-wider ${tema.textoSecundario}`}
                              >
                                {
                                  atributo.sigla
                                }
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </article>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Overall
                      </p>

                      <strong className="mt-2 block text-4xl">
                        {overall}
                      </strong>

                      <p className="mt-2 text-sm text-slate-400">
                        Calculado de acordo com os pesos da posição{' '}
                        {perfil.posicao}.
                      </p>
                    </article>

                    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Raridade
                      </p>

                      <strong className="mt-2 block text-2xl">
                        {tema.nome}
                      </strong>

                      <p className="mt-2 text-sm text-slate-400">
                        Faixa atual:{' '}
                        {tema.descricao}.
                      </p>
                    </article>

                    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Posição
                      </p>

                      <strong className="mt-2 block text-2xl">
                        {perfil.posicao}
                      </strong>
                    </article>

                    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Pé dominante
                      </p>

                      <strong className="mt-2 block text-2xl">
                        {
                          perfil.pe_dominante
                        }
                      </strong>
                    </article>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
                  <ShieldCheck
                    size={34}
                    className="mx-auto text-slate-600"
                  />

                  <h4 className="mt-4 text-lg font-bold">
                    Card ainda não configurado
                  </h4>

                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                    Este jogador ainda não confirmou sua posição e seu pé dominante. O Card completo aparecerá aqui depois da configuração.
                  </p>
                </div>
              )}
            </section>

            <section>
              <div className="mb-4">
                <p className="text-sm font-medium text-emerald-400">
                  Campeonato
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  Estatísticas
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Desempenho e posição atual nos rankings.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Goal size={22} />
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    Gols
                  </p>

                  <strong className="mt-1 block text-3xl">
                    {perfil.gols}
                  </strong>

                  <span
                    className={`mt-4 inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${classeRanking(
                      posicoes.gols,
                    )}`}
                  >
                    {textoRanking(
                      posicoes.gols,
                    )}
                  </span>
                </article>

                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <Handshake
                      size={22}
                    />
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    Assistências
                  </p>

                  <strong className="mt-1 block text-3xl">
                    {
                      perfil.assistencias
                    }
                  </strong>

                  <span
                    className={`mt-4 inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${classeRanking(
                      posicoes.assistencias,
                    )}`}
                  >
                    {textoRanking(
                      posicoes.assistencias,
                    )}
                  </span>
                </article>

                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <Trophy size={22} />
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    Vitórias
                  </p>

                  <strong className="mt-1 block text-3xl">
                    {
                      perfil.vitorias
                    }
                  </strong>

                  <span
                    className={`mt-4 inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${classeRanking(
                      posicoes.vitorias,
                    )}`}
                  >
                    {textoRanking(
                      posicoes.vitorias,
                    )}
                  </span>
                </article>

                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                    <Star size={22} />
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    Estrelas
                  </p>

                  <strong className="mt-1 block text-3xl">
                    {
                      perfil.estrelas
                    }
                  </strong>

                  <p className="mt-4 text-xs font-medium text-amber-400">
                    {perfil.estrelas ===
                    0
                      ? 'Ainda sem divisão'
                      : perfil.estrelas ===
                          1
                        ? 'Divisão 1 estrela'
                        : `Divisão ${perfil.estrelas} estrelas`}
                  </p>
                </article>
              </div>
            </section>

            <section>
              <div className="mb-4">
                <p className="text-sm font-medium text-amber-400">
                  Histórico
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  Destaques semanais
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Participações calculadas automaticamente a partir do histórico dos rachas.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
                  <Medal
                    size={32}
                    className="text-blue-300"
                  />

                  <p className="mt-5 text-sm text-slate-300">
                    Seleções da Semana
                  </p>

                  <strong className="mt-1 block text-4xl text-blue-200">
                    {
                      perfil.selecoes_semana
                    }
                  </strong>

                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Número de semanas em que o jogador terminou entre os quatro melhores.
                  </p>
                </article>

                <article className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
                  <Crown
                    size={32}
                    className="text-yellow-300"
                  />

                  <p className="mt-5 text-sm text-slate-300">
                    MVPs da Semana
                  </p>

                  <strong className="mt-1 block text-4xl text-yellow-200">
                    {perfil.mvps}
                  </strong>

                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Número de semanas em que o jogador terminou em primeiro lugar na pontuação semanal.
                  </p>
                </article>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PerfilJogador