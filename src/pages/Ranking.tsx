import {
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

type GrupoEstrelas = {
  quantidade: 5 | 4 | 3 | 2 | 1
  titulo: string
  descricao: string
  corTexto: string
  corFundo: string
  corBorda: string
}

const configuracoes: Record<TipoRanking, ConfiguracaoRanking> = {
  gols: {
    titulo: 'Ranking de gols',
    descricao: 'Confira os maiores artilheiros do campeonato.',
    rotulo: 'Gols',
    Icone: Goal,
    corTexto: 'text-emerald-400',
    corFundo: 'bg-emerald-500/10',
  },

  assistencias: {
    titulo: 'Ranking de assistências',
    descricao: 'Confira os jogadores com mais assistências.',
    rotulo: 'Assistências',
    Icone: Handshake,
    corTexto: 'text-purple-400',
    corFundo: 'bg-purple-500/10',
  },

  vitorias: {
    titulo: 'Ranking de vitórias',
    descricao: 'Confira os jogadores com mais vitórias.',
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

const gruposEstrelas: GrupoEstrelas[] = [
  {
    quantidade: 5,
    titulo: 'Divisão 5 estrelas',
    descricao: 'Nível máximo de destaque',
    corTexto: 'text-yellow-300',
    corFundo: 'bg-yellow-500/10',
    corBorda: 'border-yellow-500/30',
  },
  {
    quantidade: 4,
    titulo: 'Divisão 4 estrelas',
    descricao: 'Destaque de excelência',
    corTexto: 'text-amber-300',
    corFundo: 'bg-amber-500/10',
    corBorda: 'border-amber-500/30',
  },
  {
    quantidade: 3,
    titulo: 'Divisão 3 estrelas',
    descricao: 'Destaque intermediário',
    corTexto: 'text-orange-300',
    corFundo: 'bg-orange-500/10',
    corBorda: 'border-orange-500/30',
  },
  {
    quantidade: 2,
    titulo: 'Divisão 2 estrelas',
    descricao: 'Em evolução no campeonato',
    corTexto: 'text-sky-300',
    corFundo: 'bg-sky-500/10',
    corBorda: 'border-sky-500/30',
  },
  {
    quantidade: 1,
    titulo: 'Divisão 1 estrela',
    descricao: 'Primeiro nível de destaque',
    corTexto: 'text-slate-300',
    corFundo: 'bg-slate-500/10',
    corBorda: 'border-slate-500/30',
  },
]

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

  return 'bg-slate-800 text-slate-500'
}

function estrelasVisuais(quantidade: number) {
  return Array.from({ length: quantidade }, (_, indice) => (
    <Star
      key={indice}
      size={16}
      fill="currentColor"
    />
  ))
}

function GrupoDeEstrelas({
  grupo,
  jogadores,
  ocuparLinhaInteira = false,
}: {
  grupo: GrupoEstrelas
  jogadores: Jogador[]
  ocuparLinhaInteira?: boolean
}) {
  const jogadoresDoGrupo = jogadores
    .filter(
      (jogador) =>
        jogador.estrelas === grupo.quantidade,
    )
    .sort((primeiro, segundo) =>
      primeiro.nome.localeCompare(
        segundo.nome,
        'pt-BR',
      ),
    )

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-slate-900 ${grupo.corBorda} ${
        ocuparLinhaInteira ? 'xl:col-span-2' : ''
      }`}
    >
      <header className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${grupo.corFundo} ${grupo.corTexto}`}
          >
            <Star
              size={25}
              fill="currentColor"
            />
          </div>

          <div>
            <h3 className="text-lg font-bold">
              {grupo.titulo}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {grupo.descricao}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1 ${grupo.corTexto}`}
            aria-label={`${grupo.quantidade} estrelas`}
          >
            {estrelasVisuais(grupo.quantidade)}
          </div>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            {jogadoresDoGrupo.length}{' '}
            {jogadoresDoGrupo.length === 1
              ? 'jogador'
              : 'jogadores'}
          </span>
        </div>
      </header>

      {jogadoresDoGrupo.length > 0 ? (
        <div className="divide-y divide-slate-800">
          {jogadoresDoGrupo.map((jogador) => (
            <div
              key={jogador.id}
              className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-800/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold ${grupo.corFundo} ${grupo.corTexto}`}
                >
                  {jogador.nome
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <span className="truncate font-semibold text-white">
                  {jogador.nome}
                </span>
              </div>

              <div
                className={`flex shrink-0 items-center gap-1 ${grupo.corTexto}`}
                aria-label={`${jogador.estrelas} estrelas`}
              >
                {estrelasVisuais(jogador.estrelas)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-10 text-center">
          <Users
            size={28}
            className="mx-auto text-slate-600"
          />

          <p className="mt-3 text-sm text-slate-500">
            Nenhum jogador nesta divisão.
          </p>
        </div>
      )}
    </article>
  )
}

function Ranking({ tipo }: RankingProps) {
  const {
    jogadores,
    carregando,
    erro,
    recarregar,
  } = useJogadores()

  const configuracao = configuracoes[tipo]
  const { Icone } = configuracao

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-8">
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

        <main className="mx-auto max-w-7xl px-5 py-8">
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

  if (tipo === 'estrelas') {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-8">
          <section className="mb-8">
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
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            {gruposEstrelas.map(
              (grupo, indice) => (
                <GrupoDeEstrelas
                  key={grupo.quantidade}
                  grupo={grupo}
                  jogadores={jogadores}
                  ocuparLinhaInteira={
                    indice === gruposEstrelas.length - 1
                  }
                />
              ),
            )}
          </section>
        </main>
      </div>
    )
  }

  const jogadoresOrdenados = [...jogadores].sort(
    (primeiro, segundo) => {
      const diferenca = segundo[tipo] - primeiro[tipo]

      if (diferenca !== 0) {
        return diferenca
      }

      return primeiro.nome.localeCompare(
        segundo.nome,
        'pt-BR',
      )
    },
  )

  const lider = jogadoresOrdenados[0]

  function classeValor(campo: TipoRanking) {
    if (campo === tipo) {
      return `font-bold ${configuracao.corTexto}`
    }

    return 'text-slate-300'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-8">
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

          {lider && (
            <article className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${configuracao.corFundo} ${configuracao.corTexto}`}
              >
                {lider.nome.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Líder atual
                </p>

                <p className="font-bold">
                  {lider.nome}
                </p>
              </div>

              <div className="ml-4 border-l border-slate-700 pl-4">
                <p
                  className={`text-2xl font-bold ${configuracao.corTexto}`}
                >
                  {lider[tipo]}
                </p>

                <p className="text-xs text-slate-500">
                  {configuracao.rotulo}
                </p>
              </div>
            </article>
          )}
        </section>

        <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h3 className="text-lg font-bold">
              Classificação completa
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Ordenação do maior para o menor.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
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
                {jogadoresOrdenados.length > 0 ? (
                  jogadoresOrdenados.map(
                    (jogador, indice) => {
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
                                {jogador.nome
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <span className="font-semibold">
                                {jogador.nome}
                              </span>
                            </div>
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
                            {jogador.assistencias}
                          </td>

                          <td
                            className={`px-6 py-4 text-center ${classeValor(
                              'vitorias',
                            )}`}
                          >
                            {jogador.vitorias}
                          </td>

                          <td
                            className={`px-6 py-4 text-center ${classeValor(
                              'estrelas',
                            )}`}
                          >
                            {jogador.estrelas}
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
                      Nenhum jogador cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </main>
    </div>
  )
}

export default Ranking