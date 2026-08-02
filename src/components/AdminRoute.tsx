import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

function AdminRoute() {
  const {
    sessao,
    perfil,
    carregando,
  } = useAuth()

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

          <h1 className="mt-5 text-xl font-bold">
            Verificando permissão
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Aguarde enquanto verificamos seu perfil.
          </p>
        </section>
      </main>
    )
  }

  if (!sessao) {
    return <Navigate to="/" replace />
  }

  if (!perfil || perfil.tipo !== 'admin') {
    return <Navigate to="/inicio" replace />
  }

  return <Outlet />
}

export default AdminRoute