import {
  Goal,
  Handshake,
  Medal,
  RefreshCw,
  Star,
  Trophy,
  Users,
} from 'lucide-react'
import Header from '../components/Header'
import { useJogadores } from '../hooks/useJogadores'

function estiloPosicao(posicao: number) {
  if (posicao === 1) {
    return 'bg-amber-500/15 text-amber-400'
  }

  if (posicao === 2) {
    return 'bg-slate-500/20 text-slate-300'
  }

  if (posicao === 3) {
    return 'bg-orange-500/15 text-orange-400'
  }

  return 'text-slate-500'
}

function DashboardPage() {
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
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <h2 className="mt-5 text-xl font-bold">
              Carregando jogadores
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Buscando as estatísticas no Supabase...
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

        <main className="mx-auto max-w-7xl px-5 py-8">
          <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
            <h2 className="text-xl font-bold text-red-300">
              Erro ao carregar os dados
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

  const rankingDeGols = [...jogadores].sort(
    (primeiro, segundo) => segundo.gols - primeiro.gols,
  )

  const rankingDeEstrelas = [...jogadores].sort((primeiro, segundo) => {
    if (segundo.estrelas !== primeiro.estrelas) {
      return segundo.estrelas - primeiro.estrelas
    }

    return segundo.gols - primeiro.gols
  })

  const totalJogadores = jogadores.length

  const totalGols = jogadores.reduce(
    (total, jogador) => total + jogador.gols,
    0,
  )

  const totalAssistencias = jogadores.reduce(
    (total, jogador) => total + jogador.assistencias,
    0,
  )

  const totalVitorias = jogadores.reduce(
    (total, jogador) => total + jogador.vitorias,
    0,
  )

  const destaque = rankingDeEstrelas[0]

  const estatisticas = [
    {
      titulo: 'Jogadores',
      valor: totalJogadores,
      descricao: 'Jogadores cadastrados',
      Icone: Users,
      estilo: 'bg-blue-500/10 text-blue-400',
    },
    {
      titulo: 'Gols',
      valor: totalGols,
      descricao: 'Gols registrados',
      Icone: Goal,
      estilo: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      titulo: 'Assistências',
      valor: totalAssistencias,
      descricao: 'Assistências registradas',
      Icone: Handshake,
      estilo: 'bg-purple-500/10 text-purple-400',
    },
    {
      titulo: 'Vitórias',
      valor: totalVitorias,
      descricao: 'Vitórias registradas',
      Icone: Trophy,
      estilo: 'bg-amber-500/10 text-amber-400',
    },
  ]

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

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {estatisticas.map(
            ({ titulo, valor, descricao, Icone, estilo }) => (
              <article
                key={titulo}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg transition hover:-translate-y-1 hover:border-slate-700"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${estilo}`}
                >
                  <Icone size={24} />
                </div>

                <p className="text-sm text-slate-400">
                  {titulo}
                </p>

                <strong className="mt-1 block text-3xl font-bold">
                  {valor}
                </strong>

                <p className="mt-2 text-xs text-slate-500">
                  {descricao}
                </p>
              </article>
            ),
          )}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold">
                  Ranking de gols
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Os maiores artilheiros do campeonato
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Goal size={23} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
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
                  {rankingDeGols.length > 0 ? (
                    rankingDeGols.map((jogador, indice) => {
                      const posicao = indice + 1

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
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 font-bold text-slate-300">
                                {jogador.nome.charAt(0).toUpperCase()}
                              </div>

                              <span className="font-semibold">
                                {jogador.nome}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center font-bold text-emerald-400">
                            {jogador.gols}
                          </td>

                          <td className="px-6 py-4 text-center text-slate-300">
                            {jogador.assistencias}
                          </td>

                          <td className="px-6 py-4 text-center text-slate-300">
                            {jogador.vitorias}
                          </td>

                          <td className="px-6 py-4 text-center text-amber-400">
                            <div className="flex items-center justify-center gap-1">
                              <Star size={15} fill="currentColor" />
                              {jogador.estrelas}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        Nenhum jogador cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Medal size={23} />
              </div>

              <div>
                <h3 className="font-bold">
                  Destaque geral
                </h3>

                <p className="text-sm text-slate-400">
                  Melhor jogador atual
                </p>
              </div>
            </div>

            {destaque ? (
              <div className="rounded-2xl bg-slate-950 p-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500 bg-slate-800 text-2xl font-bold">
                  {destaque.nome.charAt(0).toUpperCase()}
                </div>

                <h4 className="mt-4 text-xl font-bold">
                  {destaque.nome}
                </h4>

                <p className="mt-1 text-sm text-slate-400">
                  Líder em estrelas
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-900 p-3">
                    <p className="text-2xl font-bold text-emerald-400">
                      {destaque.gols}
                    </p>

                    <p className="text-xs text-slate-500">
                      Gols
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900 p-3">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-400">
                      <Star size={20} fill="currentColor" />
                      {destaque.estrelas}
                    </div>

                    <p className="text-xs text-slate-500">
                      Estrelas
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900 p-3">
                    <p className="text-2xl font-bold text-purple-400">
                      {destaque.assistencias}
                    </p>

                    <p className="text-xs text-slate-500">
                      Assistências
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900 p-3">
                    <p className="text-2xl font-bold text-amber-400">
                      {destaque.vitorias}
                    </p>

                    <p className="text-xs text-slate-500">
                      Vitórias
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-950 p-6 text-center">
                <p className="text-sm text-slate-400">
                  Nenhum jogador cadastrado.
                </p>
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage