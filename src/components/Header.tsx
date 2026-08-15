import {
  CalendarDays,
  CalendarRange,
  Crown,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Settings,
  Star,
  Trophy,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import {
  NavLink,
  useNavigate,
} from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type LinkMenu = {
  caminho: string
  nome: string
  Icone: LucideIcon
}

const linksPrincipais: LinkMenu[] = [
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

  const [
    menuMobileAberto,
    setMenuMobileAberto,
  ] = useState(false)

  const linksConta: LinkMenu[] =
    perfil?.tipo === 'jogador'
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
      : []

  const linksAdmin: LinkMenu[] =
    perfil?.tipo === 'admin'
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
      : []

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

    setMenuMobileAberto(false)

    navigate('/', {
      replace: true,
    })
  }

  function fecharMenuMobile() {
    setMenuMobileAberto(false)
  }

  function LinkLateral({
    link,
    mobile = false,
  }: {
    link: LinkMenu
    mobile?: boolean
  }) {
    const {
      caminho,
      nome,
      Icone,
    } = link

    return (
      <NavLink
        to={caminho}
        end={caminho === '/ranking'}
        onClick={
          mobile
            ? fecharMenuMobile
            : undefined
        }
        title={
          mobile
            ? undefined
            : nome
        }
        className={({ isActive }) =>
          `group/item flex h-11 items-center rounded-xl transition ${
            mobile
              ? 'gap-3 px-3'
              : 'mx-2 gap-3 px-3'
          } ${
            isActive
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`
        }
      >
        <Icone
          size={19}
          className="shrink-0"
        />

        <span
          className={
            mobile
              ? 'whitespace-nowrap text-sm font-semibold'
              : 'whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100'
          }
        >
          {nome}
        </span>
      </NavLink>
    )
  }

  return (
    <>
      {/* DESKTOP / TABLET:
          barra lateral compacta que expande ao passar o mouse */}
      <aside className="group/sidebar fixed inset-y-0 left-0 z-50 hidden w-[68px] flex-col overflow-hidden border-r border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur transition-[width] duration-200 hover:w-60 md:flex">
        <div className="flex h-[72px] shrink-0 items-center border-b border-slate-800 px-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xl">
            ⚽
          </div>

          <div className="ml-3 min-w-0 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
            <h1 className="truncate text-sm font-black text-white">
              Ranking de Jogadores
            </h1>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Painel de estatísticas
            </p>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-3">
          <div className="space-y-1">
            {linksPrincipais.map(
              (link) => (
                <LinkLateral
                  key={link.caminho}
                  link={link}
                />
              ),
            )}
          </div>

          {linksConta.length > 0 && (
            <>
              <div className="mx-3 my-3 border-t border-slate-800" />

              <div className="space-y-1">
                {linksConta.map(
                  (link) => (
                    <LinkLateral
                      key={link.caminho}
                      link={link}
                    />
                  ),
                )}
              </div>
            </>
          )}

          {linksAdmin.length > 0 && (
            <>
              <div className="mx-3 my-3 border-t border-slate-800" />

              <div className="space-y-1">
                {linksAdmin.map(
                  (link) => (
                    <LinkLateral
                      key={link.caminho}
                      link={link}
                    />
                  ),
                )}
              </div>
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-slate-800 p-2">
          <button
            type="button"
            onClick={sair}
            disabled={saindo}
            title="Sair"
            className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saindo ? (
              <span className="h-[19px] w-[19px] shrink-0 animate-spin rounded-full border-2 border-slate-500 border-t-white" />
            ) : (
              <LogOut
                size={19}
                className="shrink-0"
              />
            )}

            <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
              {saindo
                ? 'Saindo...'
                : 'Sair'}
            </span>
          </button>
        </div>
      </aside>

      {/* Como o Header já está presente nas páginas autenticadas,
          este CSS reserva 68px à esquerda somente no desktop.
          A expansão da sidebar acontece por cima do conteúdo e não
          desloca a página. Ao sair das páginas com Header, a regra some. */}
      <style>
        {`
          @media (min-width: 768px) {
            body {
              padding-left: 68px;
            }
          }
        `}
      </style>

      {/* MOBILE:
          não depende de hover; usa somente um botão flutuante */}
      <button
        type="button"
        onClick={() =>
          setMenuMobileAberto(true)
        }
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/95 text-slate-200 shadow-xl backdrop-blur transition hover:bg-slate-800 md:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={21} />
      </button>

      {menuMobileAberto && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            onClick={
              fecharMenuMobile
            }
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-label="Fechar menu"
          />

          <aside className="relative flex h-full w-[min(82vw,300px)] flex-col border-r border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex h-[72px] items-center gap-3 border-b border-slate-800 px-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xl">
                ⚽
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-black text-white">
                  Ranking de Jogadores
                </h1>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Painel de estatísticas
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharMenuMobile
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="space-y-1">
                {linksPrincipais.map(
                  (link) => (
                    <LinkLateral
                      key={link.caminho}
                      link={link}
                      mobile
                    />
                  ),
                )}
              </div>

              {linksConta.length >
                0 && (
                <>
                  <div className="my-3 border-t border-slate-800" />

                  <div className="space-y-1">
                    {linksConta.map(
                      (link) => (
                        <LinkLateral
                          key={
                            link.caminho
                          }
                          link={link}
                          mobile
                        />
                      ),
                    )}
                  </div>
                </>
              )}

              {linksAdmin.length >
                0 && (
                <>
                  <div className="my-3 border-t border-slate-800" />

                  <div className="space-y-1">
                    {linksAdmin.map(
                      (link) => (
                        <LinkLateral
                          key={
                            link.caminho
                          }
                          link={link}
                          mobile
                        />
                      ),
                    )}
                  </div>
                </>
              )}
            </nav>

            <div className="border-t border-slate-800 p-3">
              <button
                type="button"
                onClick={sair}
                disabled={saindo}
                className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saindo ? (
                  <span className="h-[19px] w-[19px] shrink-0 animate-spin rounded-full border-2 border-slate-500 border-t-white" />
                ) : (
                  <LogOut
                    size={19}
                    className="shrink-0"
                  />
                )}

                <span className="text-sm font-semibold">
                  {saindo
                    ? 'Saindo...'
                    : 'Sair'}
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Reserva vertical mínima no celular para o botão não cobrir
          o início do conteúdo das páginas. Não existe barra horizontal. */}
      <div
        className="h-12 md:hidden"
        aria-hidden="true"
      />
    </>
  )
}

export default Header