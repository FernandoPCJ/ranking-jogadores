import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Goal,
  Handshake,
  Star,
  Trophy,
  UsersRound,
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
import {
  PESOS_PONTUACAO_GERAL,
} from '../utils/pontuacao'

type JogadorSelecao = {
  colocacao: number
  jogador_id: number
  nome: string
  apelido: string | null
  foto_url: string | null

  posicao: string | null
  pe_dominante: string | null

  pac: number | null
  sho: number | null
  pas: number | null
  dri: number | null
  def: number | null
  phy: number | null

  gols_semana: number
  assistencias_semana: number
  vitorias_semana: number
  pontos_semana: number
}

type DadosSelecao = {
  semana_inicio: string
  semana_fim: string
  quantidade_rachas: number
  jogadores: JogadorSelecao[]
}

function temaDoCard(overall: number) {
  const nivel = obterNivelCard(overall)

  if (nivel === 'legend') {
    return {
      nome: 'LEGEND',
      card:
        'border-yellow-500/80 bg-gradient-to-br from-stone-50 via-white to-amber-50 text-slate-950 shadow-yellow-400/25',
      destaque: 'text-amber-700',
      secundario: 'text-slate-600',
      selo:
        'border-amber-500/40 bg-amber-100 text-amber-800',
    }
  }

  if (nivel === 'ouro') {
    return {
      nome: 'OURO',
      card:
        'border-yellow-400/70 bg-gradient-to-br from-yellow-800 via-amber-950 to-slate-950 text-white shadow-yellow-900/30',
      destaque: 'text-yellow-300',
      secundario: 'text-amber-100/70',
      selo:
        'border-yellow-300/30 bg-yellow-400/10 text-yellow-300',
    }
  }

  if (nivel === 'prata') {
    return {
      nome: 'PRATA',
      card:
        'border-slate-300/60 bg-gradient-to-br from-slate-500 via-slate-800 to-slate-950 text-white shadow-slate-400/20',
      destaque: 'text-slate-100',
      secundario: 'text-slate-300',
      selo:
        'border-slate-300/30 bg-white/10 text-slate-100',
    }
  }

  return {
    nome: 'BRONZE',
    card:
      'border-amber-700/70 bg-gradient-to-br from-amber-950 via-stone-900 to-slate-950 text-white shadow-amber-950/30',
    destaque: 'text-amber-400',
    secundario: 'text-slate-400',
    selo:
      'border-amber-700/30 bg-amber-700/10 text-amber-300',
  }
}

function dataLocalISO(data: Date) {
  const ano = data.getFullYear()
  const mes = String(
    data.getMonth() + 1,
  ).padStart(2, '0')
  const dia = String(
    data.getDate(),
  ).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function adicionarDias(
  data: Date,
  quantidade: number,
) {
  const copia = new Date(data)
  copia.setDate(
    copia.getDate() + quantidade,
  )
  return copia
}

function inicioDaSemana(data: Date) {
  const copia = new Date(data)
  const dia = copia.getDay()
  const deslocamento =
    dia === 0 ? -6 : 1 - dia

  copia.setHours(12, 0, 0, 0)
  copia.setDate(
    copia.getDate() + deslocamento,
  )

  return copia
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
    },
  ).format(
    new Date(`${data}T12:00:00`),
  )
}

function CardSelecao({
  jogador,
}: {
  jogador: JogadorSelecao
}) {
  const overall =
    calcularOverall(jogador)

  const tema =
    temaDoCard(overall)

  const nome =
    jogador.apelido || jogador.nome

  const ehMvp =
    jogador.colocacao === 1

  return (
    <Link
      to={`/jogador/${jogador.jogador_id}`}
      className={`group relative block w-[138px] overflow-hidden rounded-[24px] border p-3 shadow-2xl transition hover:-translate-y-1 sm:w-[170px] sm:p-4 ${tema.card}`}
    >
      {ehMvp && (
        <div className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-amber-950 shadow-lg sm:h-9 sm:w-9">
          <Crown size={18} />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-3xl font-black sm:text-4xl ${tema.destaque}`}>
              {overall}
            </p>

            <p className="text-xs font-black sm:text-sm">
              {jogador.posicao || 'POS'}
            </p>
          </div>
        </div>

        <div className="mt-2 flex justify-center">
          {jogador.foto_url ? (
            <img
              src={jogador.foto_url}
              alt={`Foto de ${nome}`}
              className="h-24 w-24 rounded-2xl object-cover object-top sm:h-28 sm:w-28"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 text-3xl font-black text-slate-500 sm:h-28 sm:w-28">
              {nome
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
        </div>

        <div className="mt-3 text-center">
          <p className="truncate text-sm font-black uppercase sm:text-base">
            {nome}
          </p>

          <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[8px] font-black tracking-wider sm:text-[9px] ${tema.selo}`}>
            {tema.nome}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 border-t border-current/15 pt-3 text-center">
          <div>
            <p className="text-sm font-black">
              {jogador.gols_semana}
            </p>
            <p className={`text-[8px] font-bold ${tema.secundario}`}>
              GOLS
            </p>
          </div>

          <div>
            <p className="text-sm font-black">
              {jogador.assistencias_semana}
            </p>
            <p className={`text-[8px] font-bold ${tema.secundario}`}>
              AST
            </p>
          </div>

          <div>
            <p className="text-sm font-black">
              {jogador.vitorias_semana}
            </p>
            <p className={`text-[8px] font-bold ${tema.secundario}`}>
              VIT
            </p>
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className={`text-lg font-black ${tema.destaque}`}>
            {jogador.pontos_semana}
          </span>
          <span className={`ml-1 text-[9px] font-bold ${tema.secundario}`}>
            PTS
          </span>
        </div>
      </div>
    </Link>
  )
}

function SelecaoSemana() {
  const [referencia, setReferencia] =
    useState(() => new Date())

  const [dados, setDados] =
    useState<DadosSelecao | null>(
      null,
    )

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] =
    useState('')

  const carregar = useCallback(
    async () => {
      setCarregando(true)
      setErro('')

      const { data, error } =
        await supabase.rpc(
          'obter_selecao_semana',
          {
            p_data_referencia:
              dataLocalISO(
                referencia,
              ),
          },
        )

      if (error) {
        console.error(
          'Erro ao carregar seleção:',
          error,
        )

        setDados(null)
        setErro(
          error.message ||
            'Não foi possível carregar a Seleção da Semana.',
        )
        setCarregando(false)
        return
      }

      setDados(
        data as DadosSelecao,
      )

      setCarregando(false)
    },
    [referencia],
  )

  useEffect(() => {
    carregar()
  }, [carregar])

  const semanaAtual =
    useMemo(
      () =>
        inicioDaSemana(
          new Date(),
        ),
      [],
    )

  const semanaVisualizada =
    inicioDaSemana(referencia)

  const podeAvancar =
    semanaVisualizada.getTime() <
    semanaAtual.getTime()

  const jogadores =
    dados?.jogadores ?? []

  const mvp =
    jogadores[0]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400">
              <UsersRound size={20} />

              <p className="text-sm font-semibold">
                Destaques do racha
              </p>
            </div>

            <h2 className="mt-2 text-3xl font-black">
              Seleção da Semana
            </h2>

            <p className="mt-2 max-w-2xl text-slate-400">
              Os quatro melhores jogadores são definidos pelos resultados registrados nos rachas daquela semana.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setReferencia(
                  (atual) =>
                    adicionarDias(
                      atual,
                      -7,
                    ),
                )
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-emerald-500/40 hover:text-white"
              title="Semana anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() =>
                setReferencia(
                  new Date(),
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-emerald-500/40"
            >
              Semana atual
            </button>

            <button
              type="button"
              onClick={() =>
                setReferencia(
                  (atual) =>
                    adicionarDias(
                      atual,
                      7,
                    ),
                )
              }
              disabled={!podeAvancar}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-emerald-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              title="Próxima semana"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </section>

        {dados && (
          <section className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300">
              {formatarData(
                dados.semana_inicio,
              )}
              {' – '}
              {formatarData(
                dados.semana_fim,
              )}
            </span>

            <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              {dados.quantidade_rachas}{' '}
              {dados.quantidade_rachas ===
              1
                ? 'racha registrado'
                : 'rachas registrados'}
            </span>

            <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300">
              Vitória {PESOS_PONTUACAO_GERAL.vitoria} pts
            </span>

            <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              Gol {PESOS_PONTUACAO_GERAL.gol} pts
            </span>

            <span className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300">
              Assistência {PESOS_PONTUACAO_GERAL.assistencia} pts
            </span>
          </section>
        )}

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <p className="mt-4 text-sm text-slate-400">
              Montando a seleção...
            </p>
          </div>
        ) : jogadores.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
            <UsersRound
              size={40}
              className="mx-auto text-slate-600"
            />

            <h3 className="mt-4 text-xl font-bold">
              Ainda não há seleção para esta semana
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Assim que o administrador registrar as estatísticas dos rachas, os quatro melhores aparecerão automaticamente aqui.
            </p>
          </div>
        ) : (
          <>
            {mvp && (
              <section className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-4 text-center">
                <Crown
                  size={22}
                  className="text-yellow-300"
                />

                <p className="text-sm text-yellow-100">
                  <strong className="font-black text-yellow-300">
                    MVP da semana:
                  </strong>{' '}
                  {mvp.apelido ||
                    mvp.nome}{' '}
                  com{' '}
                  <strong>
                    {mvp.pontos_semana} pontos
                  </strong>
                </p>
              </section>
            )}

            <section className="relative mt-6 overflow-hidden rounded-[32px] border border-emerald-400/20 bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 p-4 shadow-2xl shadow-emerald-950/30 sm:p-8">
              <div className="pointer-events-none absolute inset-4 rounded-[24px] border-2 border-white/20 sm:inset-7" />

              <div className="pointer-events-none absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-white/20" />

              <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20 sm:h-44 sm:w-44" />

              <div className="pointer-events-none absolute left-1/2 top-4 h-20 w-48 -translate-x-1/2 rounded-b-[80px] border-x-2 border-b-2 border-white/15 sm:top-7 sm:h-28 sm:w-64" />

              <div className="pointer-events-none absolute bottom-4 left-1/2 h-20 w-48 -translate-x-1/2 rounded-t-[80px] border-x-2 border-t-2 border-white/15 sm:bottom-7 sm:h-28 sm:w-64" />

              <div className="relative z-10 grid min-h-[650px] grid-rows-3 items-center gap-4 py-8 sm:min-h-[760px]">
                <div className="flex justify-center">
                  {jogadores[0] && (
                    <CardSelecao
                      jogador={
                        jogadores[0]
                      }
                    />
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 sm:gap-20 lg:gap-40">
                  {jogadores[1] && (
                    <CardSelecao
                      jogador={
                        jogadores[1]
                      }
                    />
                  )}

                  {jogadores[2] && (
                    <CardSelecao
                      jogador={
                        jogadores[2]
                      }
                    />
                  )}
                </div>

                <div className="flex justify-center">
                  {jogadores[3] && (
                    <CardSelecao
                      jogador={
                        jogadores[3]
                      }
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <Goal className="text-emerald-400" />

                <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">
                  Gols do MVP
                </p>

                <strong className="mt-1 block text-2xl">
                  {mvp?.gols_semana ??
                    0}
                </strong>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <Handshake className="text-purple-400" />

                <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">
                  Assistências do MVP
                </p>

                <strong className="mt-1 block text-2xl">
                  {mvp?.assistencias_semana ??
                    0}
                </strong>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <Trophy className="text-amber-400" />

                <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">
                  Vitórias do MVP
                </p>

                <strong className="mt-1 block text-2xl">
                  {mvp?.vitorias_semana ??
                    0}
                </strong>
              </div>
            </section>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Star size={14} />
              Clique em qualquer card para abrir o perfil público do jogador.
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default SelecaoSemana