import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
} from 'lucide-react'
import {
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'

function EsqueciSenha() {
  const [email, setEmail] =
    useState('')

  const [enviando, setEnviando] =
    useState(false)

  const [erro, setErro] =
    useState('')

  const [enviado, setEnviado] =
    useState(false)

  async function solicitarRecuperacao(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const emailFormatado =
      email.trim().toLowerCase()

    if (!emailFormatado) {
      setErro(
        'Informe o e-mail da sua conta.',
      )
      return
    }

    setEnviando(true)
    setErro('')

    const redirectTo =
      `${window.location.origin}/redefinir-senha`

    const { error } =
      await supabase.auth
        .resetPasswordForEmail(
          emailFormatado,
          {
            redirectTo,
          },
        )

    if (error) {
      console.error(
        'Erro ao solicitar recuperação de senha:',
        error,
      )

      setErro(
        error.message ||
          'Não foi possível enviar o e-mail de recuperação.',
      )

      setEnviando(false)
      return
    }

    setEnviado(true)
    setEnviando(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Voltar ao login
          </Link>

          {enviado ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2
                  size={32}
                />
              </div>

              <h1 className="mt-5 text-2xl font-black">
                Confira seu e-mail
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Se o endereço puder receber mensagens de recuperação, você receberá um link para definir uma nova senha.
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Confira também a caixa de spam ou lixo eletrônico.
              </p>

              <button
                type="button"
                onClick={() => {
                  setEnviado(false)
                  setErro('')
                }}
                className="mt-7 w-full rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Tentar outro e-mail
              </button>

              <Link
                to="/"
                className="mt-3 flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <KeyRound size={27} />
              </div>

              <h1 className="mt-5 text-2xl font-black">
                Esqueci minha senha
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Informe o e-mail usado na sua conta. Enviaremos um link para você criar uma nova senha.
              </p>

              <form
                onSubmit={
                  solicitarRecuperacao
                }
                className="mt-7"
              >
                <label
                  htmlFor="email-recuperacao"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  E-mail
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="email-recuperacao"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    disabled={enviando}
                    placeholder="seuemail@exemplo.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                  />
                </div>

                {erro && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                    {erro}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      Enviar link de recuperação
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default EsqueciSenha