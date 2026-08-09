import {
  Crown,
  Gem,
  Goal,
  Handshake,
  Medal,
  RefreshCw,
  Star,
  Trophy,
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
  calcularOverall,
  obterNivelCard,
} from '../utils/overall'

type JogadorHall = {
  jogador_id: number
  nome: string
  apelido: string | null
  foto_url: string | null

  gols: number
  assistencias: number
  vitorias: number
  estrelas: number

  selecoes_semana: number
  mvps: number

  posicao: string | null
  pe_dominante: string | null

  pac: number | null
  sho: number | null
  pas: number | null
  dri: number | null
  def: number | null
  phy: number | null

  card_configurado: boolean
}

type DadosHall = {
  jogadores: JogadorHall[]
}

type CampoNumerico =
  | 'gols'
  | 'assistencias'
  | 'vitorias'
  | 'selecoes_semana'
  | 'mvps'

type CategoriaProps = {
  titulo: string
  subtitulo: string
  icone: React.ReactNode
  jogadores: JogadorHall[]
  campo: CampoNumerico
  sufixo: string
}

function nomeExibicao(
  jogador: JogadorHall,
) {
  return (
    jogador.apelido ||
    jogador.nome
  )
}

function ordenarPorCampo(
  jogadores: JogadorHall[],
  campo: CampoNumerico,
) {
  return [...jogadores].sort(
    (a, b) => {
      const diferenca =
        b[campo] - a[campo]

      if (diferenca !== 0) {
        return diferenca
      }

      if (
        b.vitorias !==
        a.vitorias
      ) {
        return (
          b.vitorias -
          a.vitorias
        )
      }

      if (b.gols !== a.gols) {
        return b.gols - a.gols
      }

      if (
        b.assistencias !==
        a.assistencias
      ) {
        return (
          b.assistencias -
          a.assistencias
        )
      }

      return a.nome.localeCompare(
        b.nome,
        'pt-BR',
      )
    },
  )
}

function medalha(
  indice: number,
) {
  if (indice === 0) {
    return {
      texto: '🥇',
      classe:
        'border-amber-500/30 bg-amber-500/10',
    }
  }

  if (indice === 1) {
    return {
      texto: '🥈',
      classe:
        'border-slate-400/30 bg-slate-400/10',
    }
  }

  return {
    texto: '🥉',
    classe:
      'border-orange-500/30 bg-orange-500/10',
  }
}

function Avatar({
  jogador,
}: {
  jogador: JogadorHall
}) {
  const nome =
    nomeExibicao(jogador)

  if (jogador.foto_url) {
    return (
      <img
        src={jogador.foto_url}
        alt={`Foto de ${nome}`}
        className="h-12 w-12 rounded-xl object-cover object-top"
      />
    )
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 font-black text-slate-500">
      {nome
        .charAt(0)
        .toUpperCase()}
    </div>
  )
}

function CategoriaRanking({
  titulo,
  subtitulo,
  icone,
  jogadores,
  campo,
  sufixo,
}: CategoriaProps) {
  const topTres =
    ordenarPorCampo(
      jogadores,
      campo,
    ).slice(0, 3)

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-amber-400">
          {icone}
        </div>

        <div>
          <h3 className="text-lg font-black">
            {titulo}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {subtitulo}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {topTres.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center text-sm text-slate-500">
            Ainda não há dados suficientes.
          </div>
        ) : (
          topTres.map(
            (jogador, indice) => {
              const destaque =
                medalha(indice)

              return (
                <Link
                  key={
                    jogador.jogador_id
                  }
                  to={`/jogador/${jogador.jogador_id}`}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:border-emerald-500/30 ${destaque.classe}`}
                >
                  <div className="w-8 text-center text-xl">
                    {destaque.texto}
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

                    {jogador.apelido && (
                      <p className="truncate text-xs text-slate-500">
                        {
                          jogador.nome
                        }
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <strong className="text-2xl">
                      {
                        jogador[
                          campo
                        ]
                      }
                    </strong>

                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      {sufixo}
                    </p>
                  </div>
                </Link>
              )
            },
          )
        )}
      </div>
    </article>
  )
}

function HallDaFama() {
  const [jogadores, setJogadores] =
    useState<JogadorHall[]>([])

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] =
    useState('')

  const carregar =
    useCallback(async () => {
      setCarregando(true)
      setErro('')

      const { data, error } =
        await supabase.rpc(
          'obter_hall_da_fama',
        )

      if (error) {
        console.error(
          'Erro ao carregar Hall da Fama:',
          error,
        )

        setJogadores([])
        setErro(
          'Não foi possível carregar o Hall da Fama.',
        )
        setCarregando(false)
        return
      }

      const resposta =
        data as DadosHall | null

      setJogadores(
        resposta?.jogadores ??
          [],
      )

      setCarregando(false)
    }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const legends =
    useMemo(() => {
      return jogadores
        .filter(
          (jogador) =>
            jogador.card_configurado,
        )
        .map((jogador) => ({
          ...jogador,

          overall:
            calcularOverall({
              posicao:
                jogador.posicao,
              pac: jogador.pac,
              sho: jogador.sho,
              pas: jogador.pas,
              dri: jogador.dri,
              def: jogador.def,
              phy: jogador.phy,
            }),
        }))
        .filter(
          (jogador) =>
            obterNivelCard(
              jogador.overall,
            ) === 'legend',
        )
        .sort(
          (a, b) =>
            b.overall -
              a.overall ||
            a.nome.localeCompare(
              b.nome,
              'pt-BR',
            ),
        )
    }, [jogadores])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400">
              <Crown size={21} />

              <p className="text-sm font-semibold">
                Grandes marcas
              </p>
            </div>

            <h2 className="mt-2 text-3xl font-black">
              Hall da Fama
            </h2>

            <p className="mt-2 max-w-3xl text-slate-400">
              Os maiores destaques do racha, calculados automaticamente a partir das estatísticas e do histórico semanal.
            </p>
          </div>

          <button
            type="button"
            onClick={carregar}
            disabled={carregando}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                carregando
                  ? 'animate-spin'
                  : ''
              }
            />

            Atualizar
          </button>
        </section>

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-amber-400" />

            <p className="mt-4 text-sm text-slate-400">
              Preparando o Hall da Fama...
            </p>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              <CategoriaRanking
                titulo="Reis da Semana"
                subtitulo="Jogadores com mais MVPs"
                icone={
                  <Crown size={22} />
                }
                jogadores={
                  jogadores
                }
                campo="mvps"
                sufixo="MVPs"
              />

              <CategoriaRanking
                titulo="Seleção de Elite"
                subtitulo="Mais aparições no TOP 4 semanal"
                icone={
                  <Medal size={22} />
                }
                jogadores={
                  jogadores
                }
                campo="selecoes_semana"
                sufixo="seleções"
              />

              <CategoriaRanking
                titulo="Artilheiros"
                subtitulo="Mais gols acumulados"
                icone={
                  <Goal size={22} />
                }
                jogadores={
                  jogadores
                }
                campo="gols"
                sufixo="gols"
              />

              <CategoriaRanking
                titulo="Garçons"
                subtitulo="Mais assistências acumuladas"
                icone={
                  <Handshake
                    size={22}
                  />
                }
                jogadores={
                  jogadores
                }
                campo="assistencias"
                sufixo="assist."
              />

              <CategoriaRanking
                titulo="Mais Vitoriosos"
                subtitulo="Mais vitórias acumuladas"
                icone={
                  <Trophy size={22} />
                }
                jogadores={
                  jogadores
                }
                campo="vitorias"
                sufixo="vitórias"
              />

              <article className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-stone-50 via-white to-amber-50 p-5 text-slate-950 shadow-xl shadow-yellow-500/5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Gem size={22} />
                  </div>

                  <div>
                    <h3 className="text-lg font-black">
                      Clube Legend
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      Jogadores que atingiram 90+ Overall
                    </p>
                  </div>
                </div>

                {legends.length ===
                0 ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-white/70 p-5 text-center text-sm text-slate-500">
                    Ninguém atingiu o nível Legend ainda.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {legends.map(
                      (
                        jogador,
                        indice,
                      ) => (
                        <Link
                          key={
                            jogador.jogador_id
                          }
                          to={`/jogador/${jogador.jogador_id}`}
                          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:border-amber-400"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">
                            {indice + 1}
                          </div>

                          <Avatar
                            jogador={
                              jogador
                            }
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-black">
                              {nomeExibicao(
                                jogador,
                              )}
                            </p>

                            <p className="text-xs text-slate-500">
                              {
                                jogador.posicao
                              }
                            </p>
                          </div>

                          <div className="text-right">
                            <strong className="text-2xl text-amber-700">
                              {
                                jogador.overall
                              }
                            </strong>

                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              OVR
                            </p>
                          </div>
                        </Link>
                      ),
                    )}
                  </div>
                )}

                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-amber-700">
                  <Star
                    size={14}
                    fill="currentColor"
                  />
                  Categoria máxima do Card
                </div>
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default HallDaFama