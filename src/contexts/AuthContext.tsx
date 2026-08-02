import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type TipoPerfil = 'admin' | 'jogador'

export type Perfil = {
  id: string
  nome: string
  tipo: TipoPerfil
}

type AuthContextValue = {
  sessao: Session | null
  usuario: User | null
  perfil: Perfil | null
  carregando: boolean
}

type AuthProviderProps = {
  children: ReactNode
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)

export function AuthProvider({ children }: AuthProviderProps) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  const [carregandoSessao, setCarregandoSessao] =
    useState(true)

  const [perfilCarregadoPara, setPerfilCarregadoPara] =
    useState<string | null>(null)

  useEffect(() => {
    let componenteAtivo = true

    async function carregarSessaoInicial() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!componenteAtivo) {
        return
      }

      if (error) {
        console.error('Erro ao recuperar sessão:', error)
      }

      setSessao(session)
      setCarregandoSessao(false)
    }

    carregarSessaoInicial()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setSessao(session)
      setCarregandoSessao(false)

      if (!session) {
        setPerfil(null)
        setPerfilCarregadoPara(null)
      }
    })

    return () => {
      componenteAtivo = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
  const usuarioId = sessao?.user.id

  if (!usuarioId) {
    setPerfil(null)
    setPerfilCarregadoPara(null)
    return
  }

  // Depois da validação, garantimos ao TypeScript que é uma string.
  const usuarioIdValidado: string = usuarioId

  let consultaCancelada = false

  async function carregarPerfil() {
    const { data, error } = await supabase
      .from('perfis')
      .select('id, nome, tipo')
      .eq('id', usuarioIdValidado)
      .single()

    if (consultaCancelada) {
      return
    }

    if (error) {
      console.error('Erro ao carregar perfil:', error)
      setPerfil(null)
      setPerfilCarregadoPara(usuarioIdValidado)
      return
    }

    setPerfil(data as Perfil)
    setPerfilCarregadoPara(usuarioIdValidado)
  }

  carregarPerfil()

  return () => {
    consultaCancelada = true
  }
}, [sessao?.user.id])

  const carregandoPerfil =
    Boolean(sessao?.user.id) &&
    perfilCarregadoPara !== sessao?.user.id

  const valor = useMemo<AuthContextValue>(
    () => ({
      sessao,
      usuario: sessao?.user ?? null,
      perfil,
      carregando: carregandoSessao || carregandoPerfil,
    }),
    [
      sessao,
      perfil,
      carregandoSessao,
      carregandoPerfil,
    ],
  )

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)

  if (!contexto) {
    throw new Error(
      'useAuth precisa ser usado dentro de AuthProvider.',
    )
  }

  return contexto
}