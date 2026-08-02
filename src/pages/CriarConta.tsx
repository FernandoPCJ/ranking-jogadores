import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react'
import {
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function traduzirErroCadastro(mensagem: string) {
  const mensagemNormalizada = mensagem.toLowerCase()

  if (
    mensagemNormalizada.includes('already registered') ||
    mensagemNormalizada.includes('already been registered')
  ) {
    return 'Já existe uma conta cadastrada com esse e-mail.'
  }

  if (mensagemNormalizada.includes('password')) {
    return 'A senha informada não atende aos requisitos de segurança.'
  }

  if (
    mensagemNormalizada.includes('rate limit') ||
    mensagemNormalizada.includes('too many requests')
  ) {
    return 'Muitas tentativas foram realizadas. Aguarde um pouco e tente novamente.'
  }

  if (mensagemNormalizada.includes('email')) {
    return 'Verifique se o endereço de e-mail foi informado corretamente.'
  }

  return 'Não foi possível criar a conta. Tente novamente.'
}

function CriarConta() {
  const navigate = useNavigate()
  const { sessao, carregando } = useAuth()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] =
    useState('')

  const [mostrarSenha, setMostrarSenha] =
    useState(false)

  const [
    mostrarConfirmacaoSenha,
    setMostrarConfirmacaoSenha,
  ] = useState(false)

  const [cadastrando, setCadastrando] =
    useState(false)

  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function criarConta(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const nomeNormalizado = nome.trim()
    const emailNormalizado =
      email.trim().toLowerCase()

    setErro('')
    setMensagem('')

    if (nomeNormalizado.length < 2) {
      setErro(
        'Informe um nome com pelo menos dois caracteres.',
      )
      return
    }

    if (!emailNormalizado) {
      setErro('Informe seu endereço de e-mail.')
      return
    }

    if (senha.length < 6) {
      setErro(
        'A senha deve possuir pelo menos seis caracteres.',
      )
      return
    }

    if (senha !== confirmarSenha) {
      setErro('As duas senhas informadas são diferentes.')
      return
    }

    setCadastrando(true)

    const { data, error } =
      await supabase.auth.signUp({
        email: emailNormalizado,
        password: senha,
        options: {
          data: {
            nome: nomeNormalizado,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

    if (error) {
      console.error('Erro ao criar conta:', error)

      setErro(traduzirErroCadastro(error.message))
      setCadastrando(false)
      return
    }

    setNome('')
    setEmail('')
    setSenha('')
    setConfirmarSenha('')

    if (data.session) {
      setCadastrando(false)
      navigate('/inicio', { replace: true })
      return
    }

    setMensagem(
      'Conta criada. Verifique seu e-mail e clique no link de confirmação para liberar o acesso.',
    )

    setCadastrando(false)
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

          <p className="mt-4 text-sm text-slate-400">
            Verificando sessão...
          </p>
        </div>
      </main>
    )
  }

  if (sessao) {
    return <Navigate to="/inicio" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <Link
          to="/"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar para o login
        </Link>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <UserPlus size={28} />
        </div>

        <h1 className="mt-5 text-3xl font-bold">
          Criar conta
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Crie sua conta para acompanhar o Dashboard e os
          rankings de jogadores.
        </p>

        <form
          onSubmit={criarConta}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="nome"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Nome
            </label>

            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              autoComplete="name"
              placeholder="Digite seu nome"
              disabled={cadastrando}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              placeholder="nome@exemplo.com"
              disabled={cadastrando}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Senha
            </label>

            <div className="relative">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                autoComplete="new-password"
                placeholder="No mínimo 6 caracteres"
                minLength={6}
                disabled={cadastrando}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha((valor) => !valor)
                }
                disabled={cadastrando}
                aria-label={
                  mostrarSenha
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-white disabled:opacity-50"
              >
                {mostrarSenha ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmar-senha"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Confirmar senha
            </label>

            <div className="relative">
              <input
                id="confirmar-senha"
                type={
                  mostrarConfirmacaoSenha
                    ? 'text'
                    : 'password'
                }
                value={confirmarSenha}
                onChange={(event) =>
                  setConfirmarSenha(event.target.value)
                }
                autoComplete="new-password"
                placeholder="Digite a senha novamente"
                minLength={6}
                disabled={cadastrando}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarConfirmacaoSenha(
                    (valor) => !valor,
                  )
                }
                disabled={cadastrando}
                aria-label={
                  mostrarConfirmacaoSenha
                    ? 'Ocultar confirmação da senha'
                    : 'Mostrar confirmação da senha'
                }
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-white disabled:opacity-50"
              >
                {mostrarConfirmacaoSenha ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {erro && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-300">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0"
              />

              <span>{mensagem}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={cadastrando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cadastrando ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Criando conta...
              </>
            ) : (
              <>
                <UserPlus size={19} />
                Criar minha conta
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já possui uma conta?{' '}
          <Link
            to="/"
            className="font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            Entrar
          </Link>
        </p>
      </section>
    </main>
  )
}

export default CriarConta