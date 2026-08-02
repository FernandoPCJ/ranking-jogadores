import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Jogador = {
  id: number
  nome: string
  gols: number
  assistencias: number
  vitorias: number
  estrelas: number
}

export function useJogadores() {
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregarJogadores = useCallback(async () => {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase
      .from('jogadores')
      .select(
        'id, nome, gols, assistencias, vitorias, estrelas',
      )
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar jogadores:', error)

      setErro('Não foi possível carregar os jogadores.')
      setJogadores([])
      setCarregando(false)
      return
    }

    setJogadores(data ?? [])
    setCarregando(false)
  }, [])

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