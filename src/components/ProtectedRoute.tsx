import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute() {
  const { sessao, carregando } = useAuth()
  const location = useLocation()

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

          <h1 className="mt-5 text-xl font-bold">
            Verificando acesso
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Aguarde enquanto validamos sua sessão.
          </p>
        </section>
      </main>
    )
  }

  if (!sessao) {
    const origem = `${location.pathname}${location.search}${location.hash}`

    return (
      <Navigate
        to="/"
        replace
        state={{ origem }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute