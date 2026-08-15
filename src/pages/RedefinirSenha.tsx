import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router'
import { supabase } from '../lib/supabase'

function RedefinirSenha() {
  const navigate = useNavigate()

  const [senha, setSenha] =
    useState('')

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState('')

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false)

  const [
    mostrarConfirmacao,
    setMostrarConfirmacao,
  ] = useState(false)

  const [
    verificandoSessao,
    setVerificandoSessao,
  ] = useState(true)

  const [sessaoValida, setSessaoValida] =
    useState(false)

  const [salvando, setSalvando] =
    useState(false)

  const [erro, setErro] =
    useState('')

  const [sucesso, setSucesso] =
    useState(false)

  useEffect(() => {
    let ativo = true

    async function verificarSessao() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession()

      if (!ativo) {
        return
      }

      setSessaoValida(
        Boolean(session),
      )

      setVerificandoSessao(false)
    }

    verificarSessao()

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!ativo) {
            return
          }

          if (
            event ===
              'PASSWORD_RECOVERY' ||
            event === 'SIGNED_IN'
          ) {
            setSessaoValida(
              Boolean(session),
            )

            setVerificandoSessao(
              false,
            )
          }
        },
      )

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  async function atualizarSenha(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (senha.length < 8) {
      setErro(
        'A nova senha deve ter pelo menos 8 caracteres.',
      )
      return
    }

    if (senha !== confirmarSenha) {
      setErro(
        'A confirmação da senha não corresponde.',
      )
      return
    }

    setSalvando(true)
    setErro('')

    const { error } =
      await supabase.auth.updateUser({
        password: senha,
      })

    if (error) {
      console.error(
        'Erro ao atualizar senha:',
        error,
      )

      setErro(
        error.message ||
          'Não foi possível atualizar sua senha.',
      )

      setSalvando(false)
      return
    }

    setSucesso(true)
    setSalvando(false)

    /*
     * Encerramos a sessão de recuperação para que o usuário
     * faça um novo login usando a senha recém-definida.
     */
    await supabase.auth.signOut()
  }

  if (verificandoSessao) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
          <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <p className="mt-4 text-sm text-slate-400">
              Validando link de recuperação...
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (!sessaoValida && !sucesso) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
          <section className="w-full rounded-3xl border border-red-500/20 bg-slate-900 p-8 text-center">
            <AlertCircle
              size={36}
              className="mx-auto text-red-400"
            />

            <h1 className="mt-5 text-2xl font-black">
              Link inválido ou expirado
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Solicite um novo e-mail de recuperação para continuar.
            </p>

            <Link
              to="/esqueci-senha"
              className="mt-7 flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
            >
              Solicitar novo link
            </Link>
          </section>
        </main>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
          <section className="w-full rounded-3xl border border-emerald-500/20 bg-slate-900 p-8 text-center">
            <CheckCircle2
              size={38}
              className="mx-auto text-emerald-400"
            />

            <h1 className="mt-5 text-2xl font-black">
              Senha alterada
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sua nova senha foi salva. Agora entre novamente na sua conta.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate('/', {
                  replace: true,
                })
              }
              className="mt-7 w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
            >
              Ir para o login
            </button>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <KeyRound size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Criar nova senha
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Defina uma nova senha para sua conta.
          </p>

          <form
            onSubmit={atualizarSenha}
            className="mt-7"
          >
            <label
              htmlFor="nova-senha"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Nova senha
            </label>

            <div className="relative">
              <input
                id="nova-senha"
                type={
                  mostrarSenha
                    ? 'text'
                    : 'password'
                }
                autoComplete="new-password"
                value={senha}
                onChange={(event) =>
                  setSenha(
                    event.target.value,
                  )
                }
                disabled={salvando}
                placeholder="Mínimo de 8 caracteres"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(
                    (valor) => !valor,
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-white"
                title={
                  mostrarSenha
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
              >
                {mostrarSenha ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            <label
              htmlFor="confirmar-nova-senha"
              className="mb-2 mt-5 block text-sm font-medium text-slate-200"
            >
              Confirmar nova senha
            </label>

            <div className="relative">
              <input
                id="confirmar-nova-senha"
                type={
                  mostrarConfirmacao
                    ? 'text'
                    : 'password'
                }
                autoComplete="new-password"
                value={
                  confirmarSenha
                }
                onChange={(event) =>
                  setConfirmarSenha(
                    event.target.value,
                  )
                }
                disabled={salvando}
                placeholder="Digite a nova senha novamente"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarConfirmacao(
                    (valor) => !valor,
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-white"
                title={
                  mostrarConfirmacao
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
              >
                {mostrarConfirmacao ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {erro && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Salvando...
                </>
              ) : (
                <>
                  <KeyRound size={18} />
                  Salvar nova senha
                </>
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default RedefinirSenha