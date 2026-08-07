import {
  AlertCircle,
  ArrowLeft,
  Goal,
  Handshake,
  RefreshCw,
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

  return indice >= 0 ? indice + 1 : null
}

function classeRanking(posicao: number | null) {
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

function textoRanking(posicao: number | null) {
  if (!posicao) {
    return 'Sem posição'
  }

  return `${posicao}º no ranking`
}

function PerfilJogador() {
  const { id } = useParams()

  const [perfil, setPerfil] =
    useState<PerfilPublico | null>(null)

  const [posicoes, setPosicoes] =
    useState<PosicoesRanking>({
      gols: null,
      assistencias: null,
      vitorias: null,
    })

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] = useState('')

  const carregarPerfil = useCallback(async () => {
    const jogadorId = Number(id)

    if (
      !Number.isInteger(jogadorId) ||
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
      { data: dadosPerfil, error: erroPerfil },
      { data: dadosRanking, error: erroRanking },
    ] = await Promise.all([
      supabase.rpc('obter_perfil_publico', {
        p_jogador_id: jogadorId,
      }),

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
        (dadosRanking as JogadorRanking[] | null) ??
        []

      setPosicoes({
        gols: calcularPosicao(
          jogadores,
          jogadorId,
          'gols',
        ),

        assistencias: calcularPosicao(
          jogadores,
          jogadorId,
          'assistencias',
        ),

        vitorias: calcularPosicao(
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
    perfil.apelido || perfil.nome

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
            Confira o perfil e o desempenho no campeonato.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="self-start rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-center">
              <div className="mx-auto h-36 w-36">
                {perfil.foto_url ? (
                  <img
                    src={perfil.foto_url}
                    alt={`Foto de ${nomeExibicao}`}
                    className="h-36 w-36 rounded-full border-4 border-slate-800 object-cover"
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

              <div className="mt-5 flex flex-wrap justify-center gap-1">
                {Array.from({ length: 5 }).map(
                  (_, indice) => (
                    <Star
                      key={indice}
                      size={21}
                      fill={
                        indice < perfil.estrelas
                          ? 'currentColor'
                          : 'none'
                      }
                      className={
                        indice < perfil.estrelas
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
                  : perfil.estrelas === 1
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
                  {textoRanking(posicoes.gols)}
                </span>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Handshake size={22} />
                </div>

                <p className="mt-4 text-sm text-slate-400">
                  Assistências
                </p>

                <strong className="mt-1 block text-3xl">
                  {perfil.assistencias}
                </strong>

                <span
                  className={`mt-4 inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${classeRanking(
                    posicoes.assistencias,
                  )}`}
                >
                  {textoRanking(posicoes.assistencias)}
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
                  {perfil.vitorias}
                </strong>

                <span
                  className={`mt-4 inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${classeRanking(
                    posicoes.vitorias,
                  )}`}
                >
                  {textoRanking(posicoes.vitorias)}
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
                  {perfil.estrelas}
                </strong>

                <p className="mt-4 text-xs font-medium text-amber-400">
                  {perfil.estrelas === 0
                    ? 'Ainda sem divisão'
                    : perfil.estrelas === 1
                      ? 'Divisão 1 estrela'
                      : `Divisão ${perfil.estrelas} estrelas`}
                </p>
              </article>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default PerfilJogador