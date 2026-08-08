export type EstatisticasPontuaveis = {
  gols: number
  assistencias: number
  vitorias: number
}

/**
 * Regra usada no Ranking Geral e como referência visual
 * na Seleção da Semana.
 *
 * Atenção: a Seleção da Semana também calcula a pontuação
 * no Supabase. Ao alterar estes pesos, atualize a migration
 * correspondente no banco para manter frontend e backend
 * com a mesma regra.
 */
export const PESOS_PONTUACAO_GERAL = {
  vitoria: 5,
  gol: 3,
  assistencia: 2,
} as const

/**
 * Regra de progressão das skills do Card.
 *
 * 3 gols         = +1 ponto
 * 3 assistências = +1 ponto
 * 3 vitórias     = +1 ponto
 *
 * O cálculo efetivo dos pontos disponíveis também existe
 * no Supabase por segurança.
 */
export const REGRAS_EVOLUCAO_CARD = {
  golsPorPonto: 3,
  assistenciasPorPonto: 3,
  vitoriasPorPonto: 3,
} as const

export function calcularPontuacaoGeral(
  estatisticas: EstatisticasPontuaveis,
) {
  return (
    estatisticas.vitorias *
      PESOS_PONTUACAO_GERAL.vitoria +
    estatisticas.gols *
      PESOS_PONTUACAO_GERAL.gol +
    estatisticas.assistencias *
      PESOS_PONTUACAO_GERAL.assistencia
  )
}

export function calcularPontosConquistadosCard(
  estatisticas: EstatisticasPontuaveis,
) {
  return (
    Math.floor(
      estatisticas.gols /
        REGRAS_EVOLUCAO_CARD.golsPorPonto,
    ) +
    Math.floor(
      estatisticas.assistencias /
        REGRAS_EVOLUCAO_CARD.assistenciasPorPonto,
    ) +
    Math.floor(
      estatisticas.vitorias /
        REGRAS_EVOLUCAO_CARD.vitoriasPorPonto,
    )
  )
}
