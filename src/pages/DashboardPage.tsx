import {
  AlertCircle,
  Goal,
  Handshake,
  RefreshCw,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Header from '../components/Header'
import {
  useJogadores,
  type Jogador,
} from '../hooks/useJogadores'

type CampoRanking =
  | 'gols'
  | 'assistencias'
  | 'vitorias'

type CardTop3Props = {
  titulo: string
  descricao: string
  campo: CampoRanking
  jogadores: Jogador[]
  Icone: LucideIcon
  classeIcone: string
  classeValor: string
}

const estilosPosicao = [
  {
    texto: '1º',
    classe:
      'border-amber-500/30 bg-amber-500/15 text-amber-400',
  },
  {
    texto: '2º',
    classe:
      'border-slate-300/30 bg-slate-300/10 text-slate-200',
  },
  {
    texto: '3º',
    classe:
      'border-orange-600/30 bg-orange-600/15 text-orange-400',
  },
] as const

function obterTop3(
  jogadores: Jogador[],
  campo: CampoRanking,
) {
  return [...jogadores]
    .sort((jogadorA, jogadorB) => {
      const diferenca =
        jogadorB[campo] - jogadorA[campo]

      if (diferenca !== 0) {
        return diferenca
      }

      return jogadorA.nome.localeCompare(
        jogadorB.nome,
        'pt-BR',
      )
    })
    .slice(0, 3)
}

function CardTop3({
  titulo,
  descricao,
  campo,
  jogadores,
  Icone,
  classeIcone,
  classeValor,
}: CardTop3Props) {
  const top3 = obterTop3(jogadores, campo)

  return (
    <article className="h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <header className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${classeIcone}`}
        >
          <Icone size={22} />
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">
            {titulo}
          </h3>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {descricao}
          </p>
        </div>
      </header>

      <div className="divide-y divide-slate-800">
        {top3.map((jogador, indice) => {
          const estilo = estilosPosicao[indice]

          return (
            <div
              key={jogador.id}
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-800/40"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${estilo.classe}`}
              >
                {estilo.texto}
              </span>

              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-300">
                  {jogador.nome
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <p className="truncate font-semibold text-slate-200">
                  {jogador.nome}
                </p>
              </div>

              <strong
                className={`shrink-0 text-lg ${classeValor}`}
              >
                {jogador[campo]}
              </strong>
            </div>
          )
        })}

        {top3.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Nenhum jogador disponível.
          </div>
        )}
      </div>
    </article>
  )
}

function classePosicaoTabela(indice: number) {
  if (indice === 0) {
    return 'border-amber-500/30 bg-amber-500/15 text-amber-400'
  }

  if (indice === 1) {
    return 'border-slate-300/30 bg-slate-300/10 text-slate-200'
  }

  if (indice === 2) {
    return 'border-orange-600/30 bg-orange-600/15 text-orange-400'
  }

  return 'border-slate-700 bg-slate-800 text-slate-400'
}

function DashboardPage() {
  const {
    jogadores,
    carregando,
    erro,
    recarregar,
  } = useJogadores()

  const rankingGeral = [...jogadores].sort(
    (jogadorA, jogadorB) => {
      const diferencaGols =
        jogadorB.gols - jogadorA.gols

      if (diferencaGols !== 0) {
        return diferencaGols
      }

      const diferencaAssistencias =
        jogadorB.assistencias -
        jogadorA.assistencias

      if (diferencaAssistencias !== 0) {
        return diferencaAssistencias
      }

      const diferencaVitorias =
        jogadorB.vitorias - jogadorA.vitorias

      if (diferencaVitorias !== 0) {
        return diferencaVitorias
      }

      return jogadorA.nome.localeCompare(
        jogadorB.nome,
        'pt-BR',
      )
    },
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-8">
          <p className="text-sm font-medium text-emerald-400">
            Visão geral
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            Bem-vindo ao campeonato
          </h2>

          <p className="mt-2 text-slate-400">
            Acompanhe os números e os principais jogadores.
          </p>
        </section>

        {erro && (
          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={21}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <h3 className="font-semibold text-red-300">
                  Não foi possível carregar os dados
                </h3>

                <p className="mt-1 text-sm text-red-300/80">
                  {erro}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={recarregar}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              <RefreshCw size={17} />
              Tentar novamente
            </button>
          </section>
        )}

        {carregando ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-14 text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <p className="mt-4 text-sm text-slate-400">
              Carregando estatísticas...
            </p>
          </section>
        ) : (
          <>
            <section className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <article className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Users size={24} />
                </div>

                <p className="mt-5 text-sm text-slate-400">
                  Jogadores
                </p>

                <strong className="mt-1 block text-3xl text-white">
                  {jogadores.length}
                </strong>

                <p className="mt-2 text-xs text-slate-500">
                  Jogadores cadastrados
                </p>
              </article>

              <CardTop3
                titulo="Top 3 de gols"
                descricao="Maiores artilheiros"
                campo="gols"
                jogadores={jogadores}
                Icone={Goal}
                classeIcone="bg-emerald-500/10 text-emerald-400"
                classeValor="text-emerald-400"
              />

              <CardTop3
                titulo="Top 3 de assistências"
                descricao="Maiores assistentes"
                campo="assistencias"
                jogadores={jogadores}
                Icone={Handshake}
                classeIcone="bg-purple-500/10 text-purple-400"
                classeValor="text-purple-400"
              />

              <CardTop3
                titulo="Top 3 de vitórias"
                descricao="Jogadores mais vitoriosos"
                campo="vitorias"
                jogadores={jogadores}
                Icone={Trophy}
                classeIcone="bg-amber-500/10 text-amber-400"
                classeValor="text-amber-400"
              />
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <header className="flex flex-col gap-3 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    Ranking geral
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Classificação organizada pela quantidade
                    de gols.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={recarregar}
                  disabled={carregando}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  <RefreshCw
                    size={17}
                    className={
                      carregando ? 'animate-spin' : ''
                    }
                  />
                  Atualizar
                </button>
              </header>

              {rankingGeral.length === 0 ? (
                <div className="p-12 text-center">
                  <Users
                    size={34}
                    className="mx-auto text-slate-600"
                  />

                  <h3 className="mt-4 font-semibold">
                    Nenhum jogador cadastrado
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Cadastre jogadores para visualizar o
                    ranking.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left">
                    <thead className="bg-slate-950/40 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-4">
                          Posição
                        </th>

                        <th className="px-6 py-4">
                          Jogador
                        </th>

                        <th className="px-4 py-4 text-center">
                          Gols
                        </th>

                        <th className="px-4 py-4 text-center">
                          Assistências
                        </th>

                        <th className="px-4 py-4 text-center">
                          Vitórias
                        </th>

                        <th className="px-6 py-4 text-center">
                          Estrelas
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {rankingGeral.map(
                        (jogador, indice) => (
                          <tr
                            key={jogador.id}
                            className="transition hover:bg-slate-800/40"
                          >
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-sm font-bold ${classePosicaoTabela(
                                  indice,
                                )}`}
                              >
                                {indice + 1}º
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 font-bold text-slate-300">
                                  {jogador.nome
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <span className="font-semibold text-white">
                                  {jogador.nome}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-center font-bold text-emerald-400">
                              {jogador.gols}
                            </td>

                            <td className="px-4 py-4 text-center text-slate-300">
                              {jogador.assistencias}
                            </td>

                            <td className="px-4 py-4 text-center text-slate-300">
                              {jogador.vitorias}
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1 font-semibold text-amber-400">
                                <Star
                                  size={17}
                                  fill="currentColor"
                                />

                                {jogador.estrelas}
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default DashboardPage