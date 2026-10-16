import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'

export const INTERVALO_SORTEIO_MINUTOS = 15

export type JogadorSorteio = {
  id: number
  nome: string
  apelido: string | null
  estrelas: number
}

export type TimeRegistrado = {
  numero: number
  total_estrelas: number
  jogadores: JogadorSorteio[]
}

export type SorteioRegistrado = {
  id: number
  realizado_em: string
  realizado_por: string
  quantidade_times: number
  diferenca: number
  times: TimeRegistrado[]
}

type RespostaListagem = {
  agora: string
  proximo_liberado_em: string | null
  sorteios: SorteioRegistrado[]
}

type RespostaRegistro = {
  id: number
  realizado_em: string
  proximo_liberado_em: string
  quantidade_times: number
  diferenca: number
  times: TimeRegistrado[]
}

export function formatarDataHora(
  iso: string,
) {
  const data = new Date(iso)

  const dia = data.toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  )

  const hora = data.toLocaleTimeString(
    'pt-BR',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
  )

  return `${dia} às ${hora}`
}

export function textoWhatsApp(
  times: TimeRegistrado[],
  realizadoEm: string,
) {
  const linhas = [
    '⚽ *Times do racha*',
    `🗓️ Sorteio de ${formatarDataHora(realizadoEm)}`,
    '',
  ]

  for (const time of times) {
    linhas.push(
      `*Time ${time.numero}* (${time.total_estrelas}★)`,
    )

    for (const jogador of time.jogadores) {
      linhas.push(
        `• ${jogador.apelido || jogador.nome}`,
      )
    }

    linhas.push('')
  }

  linhas.push(
    `Ver histórico: ${window.location.origin}/ranking/estrelas`,
  )

  return linhas.join('\n')
}

export function compartilharNoWhatsApp(
  times: TimeRegistrado[],
  realizadoEm: string,
) {
  const texto = textoWhatsApp(
    times,
    realizadoEm,
  )

  window.open(
    `https://wa.me/?text=${encodeURIComponent(texto)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export function useSorteios() {
  const [sorteios, setSorteios] =
    useState<SorteioRegistrado[]>([])

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] =
    useState<string | null>(null)

  /*
   * Horário em que o próximo sorteio é liberado,
   * já convertido para o relógio deste navegador
   * (corrige a diferença entre o relógio do
   * servidor e o do aparelho).
   */
  const [liberadoEm, setLiberadoEm] =
    useState<number | null>(null)

  const [agora, setAgora] =
    useState(() => Date.now())

  const carregar = useCallback(
    async () => {
      setErro(null)

      const { data, error } =
        await supabase.rpc(
          'listar_sorteios',
          { p_limite: 30 },
        )

      if (error) {
        console.error(
          'Erro ao carregar sorteios:',
          error,
        )

        setErro(
          'Não foi possível carregar o histórico de sorteios.',
        )
        setCarregando(false)
        return
      }

      const resposta =
        data as RespostaListagem

      const diferencaRelogio =
        new Date(
          resposta.agora,
        ).getTime() - Date.now()

      setSorteios(
        resposta.sorteios ?? [],
      )

      setLiberadoEm(
        resposta.proximo_liberado_em
          ? new Date(
              resposta.proximo_liberado_em,
            ).getTime() -
              diferencaRelogio
          : null,
      )

      setCarregando(false)
    },
    [],
  )

  useEffect(() => {
    carregar()
  }, [carregar])

  const segundosRestantes =
    liberadoEm === null
      ? 0
      : Math.max(
          0,
          Math.ceil(
            (liberadoEm - agora) / 1000,
          ),
        )

  useEffect(() => {
    if (segundosRestantes <= 0) {
      return
    }

    const intervalo =
      window.setInterval(
        () => setAgora(Date.now()),
        1000,
      )

    return () =>
      window.clearInterval(intervalo)
  }, [segundosRestantes])

  const registrar = useCallback(
    async (
      idsPorTime: number[][],
    ): Promise<
      | {
          ok: true
          sorteio: RespostaRegistro
        }
      | { ok: false; mensagem: string }
    > => {
      const { data, error } =
        await supabase.rpc(
          'registrar_sorteio',
          { p_times: idsPorTime },
        )

      if (error) {
        console.error(
          'Erro ao registrar sorteio:',
          error,
        )

        // Sincroniza o contador caso o limite
        // tenha sido atingido em outro aparelho.
        await carregar()

        return {
          ok: false,
          mensagem:
            error.message ||
            'Não foi possível registrar o sorteio.',
        }
      }

      await carregar()
      setAgora(Date.now())

      return {
        ok: true,
        sorteio: data as RespostaRegistro,
      }
    },
    [carregar],
  )

  return {
    sorteios,
    carregando,
    erro,
    recarregar: carregar,
    registrar,
    segundosRestantes,
  }
}
