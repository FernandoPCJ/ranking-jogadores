import {
  CalendarDays,
  Goal,
  Handshake,
  Save,
  Search,
  Trash2,
  Trophy,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import Header from '../components/Header'
import { supabase } from '../lib/supabase'

type Jogador = {
  id: number
  nome: string
  apelido: string | null
  foto_url: string | null
  gols: number
  assistencias: number
  vitorias: number
}

type EstatisticaForm = {
  gols: string
  assistencias: string
  vitorias: string
}

type RachaRecente = {
  id: number
  data: string
  tipo: 'quarta' | 'sexta' | 'extra'
  participantes: number
  gols: number
  assistencias: number
  vitorias: number
  criado_em: string
}

function hojeISO() {
  const agora = new Date()

  const ano = agora.getFullYear()
  const mes = String(
    agora.getMonth() + 1,
  ).padStart(2, '0')
  const dia = String(
    agora.getDate(),
  ).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function tipoPelaData(
  data: string,
) {
  const dia = new Date(
    `${data}T12:00:00`,
  ).getDay()

  if (dia === 3) {
    return 'quarta'
  }

  if (dia === 5) {
    return 'sexta'
  }

  return 'extra'
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(
    new Date(`${data}T12:00:00`),
  )
}

function AdminRegistrarRacha() {
  const [jogadores, setJogadores] =
    useState<Jogador[]>([])

  const [rachas, setRachas] =
    useState<RachaRecente[]>([])

  const [estatisticas, setEstatisticas] =
    useState<
      Record<number, EstatisticaForm>
    >({})

  const [dataRacha, setDataRacha] =
    useState(hojeISO())

  const [tipo, setTipo] =
    useState<
      'quarta' | 'sexta' | 'extra'
    >(() =>
      tipoPelaData(
        hojeISO(),
      ),
    )

  const [busca, setBusca] =
    useState('')

  const [carregando, setCarregando] =
    useState(true)

  const [salvando, setSalvando] =
    useState(false)

  const [excluindoId, setExcluindoId] =
    useState<number | null>(null)

  const [erro, setErro] =
    useState('')

  const [mensagem, setMensagem] =
    useState('')

  const carregar = useCallback(
    async () => {
      setCarregando(true)
      setErro('')

      const [
        jogadoresResposta,
        rachasResposta,
      ] = await Promise.all([
        supabase.rpc(
          'listar_jogadores_publicos',
        ),

        supabase.rpc(
          'listar_rachas_admin',
          {
            p_limite: 10,
          },
        ),
      ])

      if (jogadoresResposta.error) {
        console.error(
          'Erro ao carregar jogadores:',
          jogadoresResposta.error,
        )

        setErro(
          'Não foi possível carregar os jogadores.',
        )
      } else {
        const lista =
          (jogadoresResposta.data ??
            []) as Jogador[]

        setJogadores(lista)

        setEstatisticas(
          Object.fromEntries(
            lista.map(
              (jogador) => [
                jogador.id,
                {
                  gols: '0',
                  assistencias: '0',
                  vitorias: '0',
                },
              ],
            ),
          ),
        )
      }

      if (rachasResposta.error) {
        console.error(
          'Erro ao carregar rachas:',
          rachasResposta.error,
        )
      } else {
        setRachas(
          (rachasResposta.data ??
            []) as RachaRecente[],
        )
      }

      setCarregando(false)
    },
    [],
  )

  useEffect(() => {
    carregar()
  }, [carregar])

  const jogadoresFiltrados =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          )

      if (!termo) {
        return jogadores
      }

      return jogadores.filter(
        (jogador) =>
          jogador.nome
            .toLocaleLowerCase(
              'pt-BR',
            )
            .includes(termo) ||
          (
            jogador.apelido ??
            ''
          )
            .toLocaleLowerCase(
              'pt-BR',
            )
            .includes(termo),
      )
    }, [busca, jogadores])

  function atualizarCampo(
    jogadorId: number,
    campo: keyof EstatisticaForm,
    valor: string,
  ) {
    const valorLimpo =
      valor.replace(/\D/g, '')

    setEstatisticas(
      (atual) => ({
        ...atual,

        [jogadorId]: {
          ...(atual[jogadorId] ?? {
            gols: '0',
            assistencias: '0',
            vitorias: '0',
          }),

          [campo]:
            valorLimpo === ''
              ? ''
              : String(
                  Math.max(
                    Number(
                      valorLimpo,
                    ),
                    0,
                  ),
                ),
        },
      }),
    )
  }

  function limparFormulario() {
    setEstatisticas(
      Object.fromEntries(
        jogadores.map(
          (jogador) => [
            jogador.id,
            {
              gols: '0',
              assistencias: '0',
              vitorias: '0',
            },
          ],
        ),
      ),
    )
  }

  async function registrarRacha() {
    const payload =
      jogadores
        .map((jogador) => {
          const valores =
            estatisticas[
              jogador.id
            ] ?? {
              gols: '0',
              assistencias: '0',
              vitorias: '0',
            }

          return {
            jogador_id:
              jogador.id,

            gols:
              Number(
                valores.gols ||
                  0,
              ),

            assistencias:
              Number(
                valores.assistencias ||
                  0,
              ),

            vitorias:
              Number(
                valores.vitorias ||
                  0,
              ),
          }
        })
        .filter(
          (item) =>
            item.gols > 0 ||
            item.assistencias >
              0 ||
            item.vitorias > 0,
        )

    if (payload.length === 0) {
      setErro(
        'Informe pelo menos uma estatística antes de registrar o racha.',
      )
      return
    }

    const confirmou =
      window.confirm(
        `Registrar o racha de ${formatarData(dataRacha)} com estatísticas de ${payload.length} jogador(es)?\n\nEsses números serão somados aos totais gerais.`,
      )

    if (!confirmou) {
      return
    }

    setSalvando(true)
    setErro('')
    setMensagem('')

    const { data, error } =
      await supabase.rpc(
        'registrar_racha',
        {
          p_data: dataRacha,
          p_tipo: tipo,
          p_estatisticas:
            payload,
        },
      )

    if (error) {
      console.error(
        'Erro ao registrar racha:',
        error,
      )

      setErro(
        error.message ||
          'Não foi possível registrar o racha.',
      )

      setSalvando(false)
      return
    }

    const resultado =
      data as {
        jogadores_registrados?: number
      }

    setMensagem(
      `Racha registrado com sucesso para ${resultado.jogadores_registrados ?? payload.length} jogador(es).`,
    )

    limparFormulario()
    setSalvando(false)

    await carregar()
  }

  async function excluirRacha(
    racha: RachaRecente,
  ) {
    const confirmou =
      window.confirm(
        `Excluir o racha de ${formatarData(racha.data)}?\n\nAs estatísticas desse lançamento serão subtraídas dos totais dos jogadores.`,
      )

    if (!confirmou) {
      return
    }

    setExcluindoId(racha.id)
    setErro('')
    setMensagem('')

    const { error } =
      await supabase.rpc(
        'excluir_racha',
        {
          p_partida_id:
            racha.id,
        },
      )

    if (error) {
      console.error(
        'Erro ao excluir racha:',
        error,
      )

      setErro(
        error.message ||
          'Não foi possível excluir o racha.',
      )

      setExcluindoId(null)
      return
    }

    setMensagem(
      'Racha excluído e totais revertidos com sucesso.',
    )

    setExcluindoId(null)
    await carregar()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        <section>
          <div className="flex items-center gap-2 text-emerald-400">
            <CalendarDays size={20} />

            <p className="text-sm font-semibold">
              Administração
            </p>
          </div>

          <h2 className="mt-2 text-3xl font-black">
            Registrar Racha
          </h2>

          <p className="mt-2 max-w-3xl text-slate-400">
            Registre os números de cada racha. O sistema atualiza os totais gerais e usa este histórico para montar automaticamente a Seleção da Semana.
          </p>
        </section>

        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
          A partir desta funcionalidade, use esta tela para lançar novas estatísticas. O painel antigo de jogadores pode continuar sendo usado para correções administrativas excepcionais.
        </div>

        {erro && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {mensagem}
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="data-racha"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Data
              </label>

              <input
                id="data-racha"
                type="date"
                value={dataRacha}
                onChange={(event) => {
                  const novaData =
                    event.target.value

                  setDataRacha(
                    novaData,
                  )

                  setTipo(
                    tipoPelaData(
                      novaData,
                    ),
                  )
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="tipo-racha"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Tipo
              </label>

              <select
                id="tipo-racha"
                value={tipo}
                onChange={(event) =>
                  setTipo(
                    event.target
                      .value as
                      | 'quarta'
                      | 'sexta'
                      | 'extra',
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="quarta">
                  Quarta
                </option>

                <option value="sexta">
                  Sexta
                </option>

                <option value="extra">
                  Extra
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="buscar-jogador"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Buscar jogador
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="buscar-jogador"
                  value={busca}
                  onChange={(event) =>
                    setBusca(
                      event.target.value,
                    )
                  }
                  placeholder="Nome ou apelido"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-4">
            <h3 className="font-bold">
              Estatísticas do racha
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Deixe em zero quem não pontuou no lançamento.
            </p>
          </div>

          {carregando ? (
            <div className="p-12 text-center text-slate-400">
              Carregando jogadores...
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {jogadoresFiltrados.map(
                (jogador) => {
                  const valores =
                    estatisticas[
                      jogador.id
                    ] ?? {
                      gols: '0',
                      assistencias:
                        '0',
                      vitorias: '0',
                    }

                  return (
                    <div
                      key={
                        jogador.id
                      }
                      className="grid gap-4 p-4 sm:grid-cols-[minmax(180px,1fr)_repeat(3,110px)] sm:items-center sm:p-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {jogador.foto_url ? (
                          <img
                            src={
                              jogador.foto_url
                            }
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-xl object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-black text-slate-500">
                            {(
                              jogador.apelido ||
                              jogador.nome
                            )
                              .charAt(
                                0,
                              )
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {jogador.apelido ||
                              jogador.nome}
                          </p>

                          {jogador.apelido && (
                            <p className="truncate text-xs text-slate-500">
                              {
                                jogador.nome
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs text-emerald-400">
                          <Goal size={13} />
                          Gols
                        </span>

                        <input
                          inputMode="numeric"
                          value={
                            valores.gols
                          }
                          onChange={(
                            event,
                          ) =>
                            atualizarCampo(
                              jogador.id,
                              'gols',
                              event
                                .target
                                .value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center font-bold outline-none focus:border-emerald-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs text-purple-400">
                          <Handshake size={13} />
                          Assist.
                        </span>

                        <input
                          inputMode="numeric"
                          value={
                            valores.assistencias
                          }
                          onChange={(
                            event,
                          ) =>
                            atualizarCampo(
                              jogador.id,
                              'assistencias',
                              event
                                .target
                                .value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center font-bold outline-none focus:border-purple-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs text-amber-400">
                          <Trophy size={13} />
                          Vitórias
                        </span>

                        <input
                          inputMode="numeric"
                          value={
                            valores.vitorias
                          }
                          onChange={(
                            event,
                          ) =>
                            atualizarCampo(
                              jogador.id,
                              'vitorias',
                              event
                                .target
                                .value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center font-bold outline-none focus:border-amber-500"
                        />
                      </label>
                    </div>
                  )
                },
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-800 p-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={
                limparFormulario
              }
              disabled={salvando}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={
                registrarRacha
              }
              disabled={
                salvando ||
                carregando
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Registrando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Registrar racha
                </>
              )}
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-4">
            <h3 className="font-bold">
              Rachas recentes
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Excluir um lançamento também reverte as estatísticas adicionadas por ele.
            </p>
          </div>

          {rachas.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Nenhum racha registrado ainda.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {rachas.map(
                (racha) => (
                  <div
                    key={racha.id}
                    className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>
                          {formatarData(
                            racha.data,
                          )}
                        </strong>

                        <span className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {
                            racha.tipo
                          }
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {racha.participantes}{' '}
                        jogadores ·{' '}
                        {racha.gols} gols ·{' '}
                        {racha.assistencias}{' '}
                        assistências ·{' '}
                        {racha.vitorias}{' '}
                        vitórias
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        excluirRacha(
                          racha,
                        )
                      }
                      disabled={
                        excluindoId ===
                        racha.id
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <Trash2 size={16} />

                      {excluindoId ===
                      racha.id
                        ? 'Excluindo...'
                        : 'Excluir'}
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default AdminRegistrarRacha