import {
  AlertCircle,
  CalendarDays,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type JogadorAdmin = {
  id: number
  nome: string
  gols: number
  assistencias: number
  vitorias: number
  estrelas: number
  ativo: boolean
  atualizado_em: string
}

type FormularioJogador = {
  nome: string
  estrelas: string
}

const formularioVazio: FormularioJogador = {
  nome: '',
  estrelas: '0',
}

function AdminJogadores() {
  const { perfil } = useAuth()
  const navigate = useNavigate()

  const [jogadores, setJogadores] = useState<JogadorAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [jogadorEmEdicao, setJogadorEmEdicao] =
    useState<JogadorAdmin | null>(null)

  const [formulario, setFormulario] =
    useState<FormularioJogador>(formularioVazio)

  const [salvando, setSalvando] = useState(false)

  const [alterandoStatusId, setAlterandoStatusId] =
    useState<number | null>(null)

  const carregarJogadores = useCallback(async () => {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase
      .from('jogadores')
      .select(
        `
          id,
          nome,
          gols,
          assistencias,
          vitorias,
          estrelas,
          ativo,
          atualizado_em
        `,
      )
      .order('ativo', { ascending: false })
      .order('nome', { ascending: true })

    if (error) {
      console.error(
        'Erro ao carregar jogadores administrativos:',
        error,
      )

      setErro(
        'Não foi possível carregar os jogadores. Verifique as políticas do Supabase.',
      )

      setJogadores([])
      setCarregando(false)
      return
    }

    setJogadores((data as JogadorAdmin[]) ?? [])
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregarJogadores()
  }, [carregarJogadores])

  function atualizarCampo(
    campo: keyof FormularioJogador,
    valor: string,
  ) {
    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      [campo]: valor,
    }))
  }

  function abrirCadastro() {
    setJogadorEmEdicao(null)
    setFormulario(formularioVazio)
    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function abrirEdicao(jogador: JogadorAdmin) {
    setJogadorEmEdicao(jogador)

    setFormulario({
      nome: jogador.nome,
      estrelas: String(jogador.estrelas),
    })

    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) {
      return
    }

    setModalAberto(false)
    setJogadorEmEdicao(null)
    setFormulario(formularioVazio)
  }

  function converterNumero(
    valor: string,
    nomeCampo: string,
  ) {
    const numero = Number(valor)

    if (!Number.isInteger(numero) || numero < 0) {
      throw new Error(
        `${nomeCampo} deve ser um número inteiro igual ou maior que zero.`,
      )
    }

    return numero
  }

  async function salvarJogador(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const nome = formulario.nome.trim()

    if (!nome) {
      setErro('Informe o nome do jogador.')
      return
    }

    let estrelas: number

    try {
      estrelas = converterNumero(
        formulario.estrelas,
        'Estrelas',
      )
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Verifique os valores informados.',
      )

      return
    }

    setSalvando(true)
    setErro('')
    setMensagem('')

    if (jogadorEmEdicao) {
      const { error } = await supabase
        .from('jogadores')
        .update({
          nome,
          estrelas,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', jogadorEmEdicao.id)

      if (error) {
        console.error('Erro ao editar jogador:', error)

        setErro(
          'Não foi possível editar o jogador. Verifique sua permissão de administrador.',
        )

        setSalvando(false)
        return
      }

      setMensagem(`${nome} foi atualizado com sucesso.`)
    } else {
      const { error } = await supabase
        .from('jogadores')
        .insert({
          nome,
          estrelas,
          ativo: true,
        })

      if (error) {
        console.error('Erro ao cadastrar jogador:', error)

        setErro(
          'Não foi possível cadastrar o jogador. Verifique sua permissão de administrador.',
        )

        setSalvando(false)
        return
      }

      setMensagem(`${nome} foi cadastrado com sucesso.`)
    }

    setSalvando(false)
    setModalAberto(false)
    setJogadorEmEdicao(null)
    setFormulario(formularioVazio)

    await carregarJogadores()
  }

  async function alterarStatus(jogador: JogadorAdmin) {
    const novoStatus = !jogador.ativo

    if (!novoStatus) {
      const confirmou = window.confirm(
        `Deseja desativar ${jogador.nome}?\n\nO jogador deixará de aparecer no Dashboard e nos rankings.`,
      )

      if (!confirmou) {
        return
      }
    }

    setAlterandoStatusId(jogador.id)
    setErro('')
    setMensagem('')

    const { error } = await supabase
      .from('jogadores')
      .update({
        ativo: novoStatus,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', jogador.id)

    if (error) {
      console.error(
        'Erro ao alterar status do jogador:',
        error,
      )

      setErro(
        'Não foi possível alterar o status do jogador.',
      )

      setAlterandoStatusId(null)
      return
    }

    setMensagem(
      novoStatus
        ? `${jogador.nome} foi reativado.`
        : `${jogador.nome} foi desativado.`,
    )

    setAlterandoStatusId(null)

    await carregarJogadores()
  }

  function formatarData(data: string) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(data))
  }

  const jogadoresAtivos = jogadores.filter(
    (jogador) => jogador.ativo,
  ).length

  const jogadoresInativos =
    jogadores.length - jogadoresAtivos

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <ShieldCheck size={28} />
            </div>

            <p className="text-sm font-medium text-blue-400">
              Área administrativa
            </p>

            <h2 className="mt-1 text-3xl font-bold">
              Gerenciar jogadores
            </h2>

            <p className="mt-2 text-slate-400">
              Olá, {perfil?.nome}. Gerencie os dados cadastrais
              dos jogadores. As estatísticas oficiais são
              alimentadas pelos rachas registrados.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/admin/registrar-racha')}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <CalendarDays size={20} />
              Registrar racha
            </button>

            <button
              type="button"
              onClick={abrirCadastro}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
            >
              <Plus size={20} />
              Adicionar jogador
            </button>
          </div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total cadastrado
            </p>

            <strong className="mt-2 block text-3xl">
              {jogadores.length}
            </strong>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Jogadores ativos
            </p>

            <strong className="mt-2 block text-3xl text-emerald-400">
              {jogadoresAtivos}
            </strong>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Jogadores inativos
            </p>

            <strong className="mt-2 block text-3xl text-slate-400">
              {jogadoresInativos}
            </strong>
          </article>
        </section>

        <section className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                <Lock size={19} />
              </div>

              <div>
                <h3 className="font-bold text-blue-200">
                  Estatísticas oficiais protegidas
                </h3>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">
                  Gols, assistências e vitórias são somente leitura nesta tela.
                  Para adicionar novos resultados, registre o racha correspondente.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/registrar-racha')}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              <CalendarDays size={17} />
              Registrar racha
            </button>
          </div>
        </section>

        {mensagem && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            {mensagem}
          </div>
        )}

        {erro && !modalAberto && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <AlertCircle className="mt-0.5 shrink-0" size={19} />
            {erro}
          </div>
        )}

        <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div>
              <h3 className="text-lg font-bold">
                Jogadores cadastrados
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Consulte as estatísticas oficiais e gerencie nome,
                estrelas e status dos jogadores.
              </p>
            </div>

            <button
              type="button"
              onClick={carregarJogadores}
              disabled={carregando}
              title="Atualizar jogadores"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={carregando ? 'animate-spin' : ''}
              />
            </button>
          </div>

          {carregando ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

              <p className="mt-4 text-sm text-slate-400">
                Carregando jogadores...
              </p>
            </div>
          ) : jogadores.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                <Users size={30} />
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Nenhum jogador cadastrado
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Use o botão “Adicionar jogador” para começar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Jogador</th>
                    <th className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1">
                        Gols <Lock size={11} />
                      </span>
                    </th>
                    <th className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1">
                        Assistências <Lock size={11} />
                      </span>
                    </th>
                    <th className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1">
                        Vitórias <Lock size={11} />
                      </span>
                    </th>
                    <th className="px-4 py-4 text-center">
                      Estrelas
                    </th>
                    <th className="px-4 py-4 text-center">
                      Status
                    </th>
                    <th className="px-4 py-4">
                      Atualizado em
                    </th>
                    <th className="px-6 py-4 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {jogadores.map((jogador) => (
                    <tr
                      key={jogador.id}
                      className={`transition hover:bg-slate-800/40 ${
                        !jogador.ativo ? 'opacity-65' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 font-bold text-slate-300">
                            {jogador.nome
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold">
                              {jogador.nome}
                            </p>

                            <p className="text-xs text-slate-500">
                              ID {jogador.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center font-semibold text-emerald-400">
                        {jogador.gols}
                      </td>

                      <td className="px-4 py-4 text-center">
                        {jogador.assistencias}
                      </td>

                      <td className="px-4 py-4 text-center">
                        {jogador.vitorias}
                      </td>

                      <td className="px-4 py-4 text-center text-amber-400">
                        {jogador.estrelas}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            jogador.ativo
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {jogador.ativo
                            ? 'Ativo'
                            : 'Inativo'}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-400">
                        {formatarData(jogador.atualizado_em)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(jogador)}
                            className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              alterarStatus(jogador)
                            }
                            disabled={
                              alterandoStatusId === jogador.id
                            }
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              jogador.ativo
                                ? 'border-slate-700 text-slate-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {jogador.ativo ? (
                              <>
                                <UserX size={16} />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck size={16} />
                                Reativar
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </main>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <section className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold">
                  {jogadorEmEdicao
                    ? 'Editar jogador'
                    : 'Adicionar jogador'}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {jogadorEmEdicao
                    ? 'Edite apenas os dados administrativos permitidos.'
                    : 'Cadastre o jogador com estatísticas iniciais zeradas.'}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X size={22} />
              </button>
            </header>

            <form onSubmit={salvarJogador} className="p-6">
              <div>
                <label
                  htmlFor="nome-jogador"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Nome do jogador
                </label>

                <input
                  id="nome-jogador"
                  type="text"
                  value={formulario.nome}
                  onChange={(event) =>
                    atualizarCampo(
                      'nome',
                      event.target.value,
                    )
                  }
                  placeholder="Exemplo: Carlos"
                  disabled={salvando}
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              {jogadorEmEdicao && (
                <div className="mt-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <Lock size={16} className="text-blue-400" />
                    Estatísticas oficiais
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Gols
                      </p>
                      <strong className="mt-1 block text-xl text-emerald-400">
                        {jogadorEmEdicao.gols}
                      </strong>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Assistências
                      </p>
                      <strong className="mt-1 block text-xl">
                        {jogadorEmEdicao.assistencias}
                      </strong>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Vitórias
                      </p>
                      <strong className="mt-1 block text-xl">
                        {jogadorEmEdicao.vitorias}
                      </strong>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Estes valores são atualizados pelo fluxo de Registrar Racha
                    e não podem ser alterados neste formulário.
                  </p>
                </div>
              )}

              {!jogadorEmEdicao && (
                <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Lock size={17} className="mt-0.5 shrink-0 text-blue-300" />
                    <p className="text-sm leading-6 text-slate-300">
                      O novo jogador será criado com <strong>0 gols</strong>,{' '}
                      <strong>0 assistências</strong> e <strong>0 vitórias</strong>.
                      Os resultados serão adicionados posteriormente pelos rachas.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <label
                  htmlFor="campo-estrelas"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Estrelas
                </label>

                <input
                  id="campo-estrelas"
                  type="number"
                  min="0"
                  step="1"
                  value={formulario.estrelas}
                  onChange={(event) =>
                    atualizarCampo(
                      'estrelas',
                      event.target.value,
                    )
                  }
                  disabled={salvando}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              {erro && modalAberto && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle
                    className="mt-0.5 shrink-0"
                    size={18}
                  />

                  {erro}
                </div>
              )}

              <footer className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                  className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={19} />
                      {jogadorEmEdicao
                        ? 'Salvar alterações'
                        : 'Cadastrar jogador'}
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminJogadores