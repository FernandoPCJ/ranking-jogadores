import { UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type EstadoNavegacao = {
  origem?: string
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    sessao,
    carregando: verificandoSessao,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)

  const estadoNavegacao =
    location.state as EstadoNavegacao | null

  const origem = estadoNavegacao?.origem

  /*
   * Aceita somente caminhos internos da aplicação.
   * Isso impede redirecionamentos para endereços externos.
   */
  const destinoDepoisDoLogin =
    typeof origem === 'string' &&
    origem.startsWith('/') &&
    !origem.startsWith('//')
      ? origem
      : '/inicio'

  async function entrar(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const emailFormatado = email
      .trim()
      .toLowerCase()

    if (!emailFormatado || !senha) {
      setMensagem('Preencha o e-mail e a senha.')
      return
    }

    setCarregando(true)
    setMensagem('')

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: emailFormatado,
        password: senha,
      })

    if (error || !data.user) {
      console.error('Erro no login:', error)

      setMensagem('E-mail ou senha inválidos.')
      setCarregando(false)
      return
    }

    const {
      data: perfil,
      error: erroPerfil,
    } = await supabase
      .from('perfis')
      .select('nome, tipo')
      .eq('id', data.user.id)
      .single()

    if (erroPerfil || !perfil) {
      console.error(
        'Erro ao consultar perfil:',
        erroPerfil,
      )

      await supabase.auth.signOut()

      setMensagem(
        'Sua conta existe, mas o perfil de acesso não foi encontrado.',
      )

      setCarregando(false)
      return
    }

    console.log('Usuário autenticado:', {
      nome: perfil.nome,
      tipo: perfil.tipo,
    })

    navigate(destinoDepoisDoLogin, {
      replace: true,
    })
  }

  if (verificandoSessao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

          <p className="mt-4 text-sm text-slate-400">
            Verificando sessão...
          </p>
        </div>
      </main>
    )
  }

  /*
   * Caso o usuário já esteja conectado e tente acessar
   * a tela de login, ele será redirecionado.
   */
  if (sessao) {
    return (
      <Navigate
        to={destinoDepoisDoLogin}
        replace
      />
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-3xl">
            ⚽
          </div>

          <h1 className="text-3xl font-bold text-white">
            Ranking de Jogadores
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Entre para consultar ou administrar as
            estatísticas.
          </p>
        </header>

        <form
          className="space-y-5"
          onSubmit={entrar}
        >
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
              placeholder="exemplo@email.com"
              autoComplete="email"
              disabled={carregando}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Senha
            </label>

            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              placeholder="Digite sua senha"
              autoComplete="current-password"
              disabled={carregando}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {mensagem && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300"
            >
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? (
              <>
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />

          <span className="text-xs uppercase tracking-wider text-slate-600">
            ou
          </span>

          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <Link
          to="/criar-conta"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <UserPlus size={19} />
          Criar conta
        </Link>

        <p className="mt-8 text-center text-xs text-slate-500">
          Acesso para jogadores e administradores.
        </p>
      </section>
    </main>
  )
}

export default Login