import {
  Goal,
  Handshake,
  RefreshCw,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
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

function RankingEstrelas({
  jogadores,
}: {
  jogadores: Jogador[]
}) {
  return (
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