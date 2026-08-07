import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'

export type Jogador = {
  id: number
  nome: string
  gols: number
  assistencias: number
  vitorias: number
  estrelas: number
  ativo: boolean
  apelido: string | null
  foto_url: string | null
}

export function useJogadores() {
  const [jogadores, setJogadores] =
    useState<Jogador[]>([])

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] =
    useState<string | null>(null)

  const carregarJogadores = useCallback(
    async () => {
      setCarregando(true)
      setErro(null)

      const {
        data,
        error,
      } = await supabase.rpc(
        'listar_jogadores_publicos',
      )

      if (error) {
        console.error(
          'Erro ao carregar jogadores:',
          error,
        )

        setJogadores([])
        setErro(
          'Não foi possível carregar os jogadores.',
        )
        setCarregando(false)
        return
      }

      setJogadores(
        (data as Jogador[] | null) ?? [],
      )

      setCarregando(false)
    },
    [],
  )

  useEffect(() => {
    carregarJogadores()
  }, [carregarJogadores])

  return {
    jogadores,
    carregando,
    erro,
    recarregar: carregarJogadores,
  }
}