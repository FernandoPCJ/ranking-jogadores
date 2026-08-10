import {
  CalendarDays,
  CalendarRange,
  Crown,
  CreditCard,
  Home,
  LogOut,
  Settings,
  Star,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'
import {
  NavLink,
  useNavigate,
} from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const links = [
  {
    caminho: '/inicio',
    nome: 'Início',
    Icone: Home,
  },
  {
    caminho: '/ranking',
    nome: 'Ranking',
    Icone: Trophy,
  },
  {
    caminho: '/ranking/estrelas',
    nome: 'Estrelas',
    Icone: Star,
  },
  {
    caminho: '/selecao-da-semana',
    nome: 'Seleção',
    Icone: UsersRound,
  },
  {
    caminho: '/hall-da-fama',
    nome: 'Hall da Fama',
    Icone: Crown,
  },
  {
    caminho: '/temporadas',
    nome: 'Temporadas',
    Icone: CalendarRange,
  },
]

function Header() {
  const navigate = useNavigate()
  const { perfil } = useAuth()

  const [saindo, setSaindo] =
    useState(false)

  const linksVisiveis = [
    ...links,

    ...(perfil?.tipo === 'jogador'
      ? [
          {
            caminho: '/meu-perfil',
            nome: 'Meu perfil',
            Icone: UserRound,
          },
          {
            caminho: '/meu-card',
            nome: 'Card',
            Icone: CreditCard,
          },
        ]
      : []),

    ...(perfil?.tipo === 'admin'
      ? [
          {
            caminho:
              '/admin/registrar-racha',
            nome: 'Racha',
            Icone: CalendarDays,
          },
          {
            caminho:
              '/admin/jogadores',
            nome: 'Admin',
            Icone: Settings,
          },
        ]
      : []),
  ]

  async function sair() {
    if (saindo) {
      return
    }

    setSaindo(true)

    const { error } =
      await supabase.auth.signOut()

    if (error) {
      console.error(
        'Erro ao encerrar sessão:',
        error,
      )

      setSaindo(false)
      return
    }

    navigate('/', {
      replace: true,
    })
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xl">
            ⚽
          </div>

          <div>
            <h1 className="font-bold text-white">
              Ranking de Jogadores
            </h1>

            <p className="text-xs text-slate-400">
              Painel geral de estatísticas
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50 p-1">
            {linksVisiveis.map(
              ({
                caminho,
                nome,
                Icone,
              }) => (
                <NavLink
                  key={caminho}
                  to={caminho}
                  end={caminho === '/ranking'}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icone size={16} />
                  {nome}
                </NavLink>
              ),
            )}
          </nav>

          <button
            type="button"
            onClick={sair}
            disabled={saindo}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saindo ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-white" />
                Saindo...
              </>
            ) : (
              <>
                <LogOut size={18} />
                Sair
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header