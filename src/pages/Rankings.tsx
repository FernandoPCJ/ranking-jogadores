import {
  Goal,
  Handshake,
  RefreshCw,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import Header from '../components/Header'
import {
  useJogadores,
  type Jogador,
} from '../hooks/useJogadores'

type CampoRanking =
  | 'gols'
  | 'assistencias'
  | 'vitorias'

type ConfiguracaoColuna = {
  campo: CampoRanking
  titulo: string
  descricao: string
  rotulo: string
  Icone: LucideIcon
  classeIcone: string
  classeValor: string
}

const colunas: ConfiguracaoColuna[] = [
  {
    campo: 'gols',
    titulo: 'Gols',
    descricao: 'Maiores artilheiros',
    rotulo: 'gols',
    Icone: Goal,
    classeIcone:
      'bg-emerald-500/10 text-emerald-400',
    classeValor:
      'text-emerald-400',
  },
  {
    campo: 'assistencias',
    titulo: 'Assistências',
    descricao: 'Maiores garçons',
    rotulo: 'assist.',
    Icone: Handshake,
    classeIcone:
      'bg-purple-500/10 text-purple-400',
    classeValor:
      'text-purple-400',
  },
  {
    campo: 'vitorias',
    titulo: 'Vitórias',
    descricao: 'Jogadores mais vitoriosos',
    rotulo: 'vitórias',
    Icone: Trophy,
    classeIcone:
      'bg-amber-500/10 text-amber-400',
    classeValor:
      'text-amber-400',
  },
]

function estiloPosicao(
  posicao: number,
) {
  if (posicao === 1) {
    return 'border-amber-500/30 bg-amber-500/15 text-amber-400'
  }

  if (posicao === 2) {
    return 'border-slate-300/30 bg-slate-300/10 text-slate-200'
  }

  if (posicao === 3) {
    return 'border-orange-600/30 bg-orange-600/15 text-orange-400'
  }

  return 'border-slate-700 bg-slate-800 text-slate-400'
}

function nomeExibicao(
  jogador: Jogador,
) {
  return (
    jogador.apelido ||
    jogador.nome
  )
}

function ordenarJogadores(
  jogadores: Jogador[],
  campo: CampoRanking,
) {
  return [...jogadores].sort(
    (a, b) => {
      const diferenca =
        b[campo] - a[campo]

      if (diferenca !== 0) {
        return diferenca
      }

      return a.nome.localeCompare(
        b.nome,
        'pt-BR',
        {
          sensitivity: 'base',
        },
      )
    },
  )
}

function Avatar({
  jogador,
}: {
  jogador: Jogador
}) {
  const nome =
    nomeExibicao(jogador)

  if (jogador.foto_url) {
    return (
      <img
        src={jogador.foto_url}
        alt={`Foto de ${nome}`}
        className="h-10 w-10 shrink-0 rounded-full border border-slate-700 object-cover object-top"
      />
    )
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-slate-400">
      {nome
        .charAt(0)
        .toUpperCase()}
    </div>
  )
}

function ColunaRanking({
  configuracao,
  jogadores,
}: {
  configuracao: ConfiguracaoColuna
  jogadores: Jogador[]
}) {
  const {
    campo,
    titulo,
    descricao,
    rotulo,
    Icone,
    classeIcone,
    classeValor,
  } = configuracao

  const ordenados =
    ordenarJogadores(
      jogadores,
      campo,
    )

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
      <header className="border-b border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${classeIcone}`}
          >
            <Icone size={22} />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-black">
              {titulo}
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              {descricao}
            </p>
          </div>
        </div>
      </header>

      {ordenados.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Nenhum jogador disponível.
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {ordenados.map(
            (jogador, indice) => {
              const posicao =
                indice + 1

              return (
                <Link
                  key={jogador.id}
                  to={`/jogador/${jogador.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-800/50"
                >
                  <span
                    className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border px-2 text-sm font-black ${estiloPosicao(
                      posicao,
                    )}`}
                  >
                    {posicao}º
                  </span>

                  <Avatar
                    jogador={jogador}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {nomeExibicao(
                        jogador,
                      )}
                    </p>

                    {jogador.apelido && (
                      <p className="truncate text-xs text-slate-500">
                        {jogador.nome}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <strong
                      className={`text-xl ${classeValor}`}
                    >
                      {jogador[campo]}
                    </strong>

                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      {rotulo}
                    </p>
                  </div>
                </Link>
              )
            },
          )}
        </div>
      )}
    </article>
  )
}

function Rankings() {
  const {
    jogadores,
    carregando,
    erro,
    recarregar,
  } = useJogadores()

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-8">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <h2 className="mt-5 text-xl font-bold">
              Carregando rankings
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Buscando as estatísticas dos jogadores.
            </p>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-5 sm:py-8">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Classificações
            </p>

            <h2 className="mt-1 text-3xl font-black">
              Ranking
            </h2>

            <p className="mt-2 max-w-2xl text-slate-400">
              Gols, assistências e vitórias reunidos em uma única página.
            </p>
          </div>

          <button
            type="button"
            onClick={recarregar}
            disabled={carregando}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Atualizar
          </button>
        </section>

        {erro && (
          <section className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm text-red-300">
              {erro}
            </p>

            <button
              type="button"
              onClick={recarregar}
              className="mt-4 flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </section>
        )}

        {!erro && (
          <section className="mt-8 grid items-start gap-5 xl:grid-cols-3">
            {colunas.map(
              (configuracao) => (
                <ColunaRanking
                  key={
                    configuracao.campo
                  }
                  configuracao={
                    configuracao
                  }
                  jogadores={
                    jogadores
                  }
                />
              ),
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default Rankings