export type AtributoCard =
  | 'pac'
  | 'sho'
  | 'pas'
  | 'dri'
  | 'def'
  | 'phy'

export type PosicaoCard =
  | 'GOL'
  | 'ZAG'
  | 'LE'
  | 'LD'
  | 'VOL'
  | 'MC'
  | 'MEI'
  | 'PE'
  | 'PD'
  | 'ATA'

export type NivelCard =
  | 'bronze'
  | 'prata'
  | 'ouro'
  | 'legend'

export type DadosParaOverall = {
  posicao?: string | null
  pac?: number | null
  sho?: number | null
  pas?: number | null
  dri?: number | null
  def?: number | null
  phy?: number | null
}

type PesosOverall = Record<
  AtributoCard,
  number
>

export const POSICOES_CARD: readonly PosicaoCard[] = [
  'GOL',
  'ZAG',
  'LE',
  'LD',
  'VOL',
  'MC',
  'MEI',
  'PE',
  'PD',
  'ATA',
]

export const ATRIBUTOS_CARD: {
  chave: AtributoCard
  sigla: string
  nome: string
}[] = [
  {
    chave: 'pac',
    sigla: 'PAC',
    nome: 'Corrida',
  },
  {
    chave: 'sho',
    sigla: 'SHO',
    nome: 'Chute',
  },
  {
    chave: 'pas',
    sigla: 'PAS',
    nome: 'Passe',
  },
  {
    chave: 'dri',
    sigla: 'DRI',
    nome: 'Drible',
  },
  {
    chave: 'def',
    sigla: 'DEF',
    nome: 'Defesa',
  },
  {
    chave: 'phy',
    sigla: 'PHY',
    nome: 'Físico',
  },
]

export const PESOS_POR_POSICAO: Record<
  PosicaoCard,
  PesosOverall
> = {
  ATA: {
    pac: 0.15,
    sho: 0.3,
    pas: 0.1,
    dri: 0.2,
    def: 0.05,
    phy: 0.2,
  },

  PE: {
    pac: 0.25,
    sho: 0.2,
    pas: 0.15,
    dri: 0.25,
    def: 0.05,
    phy: 0.1,
  },

  PD: {
    pac: 0.25,
    sho: 0.2,
    pas: 0.15,
    dri: 0.25,
    def: 0.05,
    phy: 0.1,
  },

  MEI: {
    pac: 0.1,
    sho: 0.15,
    pas: 0.3,
    dri: 0.25,
    def: 0.05,
    phy: 0.15,
  },

  MC: {
    pac: 0.1,
    sho: 0.1,
    pas: 0.3,
    dri: 0.2,
    def: 0.15,
    phy: 0.15,
  },

  VOL: {
    pac: 0.1,
    sho: 0.05,
    pas: 0.2,
    dri: 0.1,
    def: 0.3,
    phy: 0.25,
  },

  LE: {
    pac: 0.2,
    sho: 0.05,
    pas: 0.2,
    dri: 0.15,
    def: 0.25,
    phy: 0.15,
  },

  LD: {
    pac: 0.2,
    sho: 0.05,
    pas: 0.2,
    dri: 0.15,
    def: 0.25,
    phy: 0.15,
  },

  ZAG: {
    pac: 0.05,
    sho: 0.05,
    pas: 0.1,
    dri: 0.05,
    def: 0.4,
    phy: 0.35,
  },

  /**
   * Provisório enquanto o sistema ainda usa as mesmas
   * seis skills para jogadores de linha e goleiros.
   */
  GOL: {
    pac: 0.05,
    sho: 0.02,
    pas: 0.18,
    dri: 0.05,
    def: 0.45,
    phy: 0.25,
  },
}

const PESOS_PADRAO: PesosOverall = {
  pac: 1 / 6,
  sho: 1 / 6,
  pas: 1 / 6,
  dri: 1 / 6,
  def: 1 / 6,
  phy: 1 / 6,
}

function valorAtributo(
  valor: number | null | undefined,
) {
  return valor ?? 50
}

export function calcularOverall(
  dados: DadosParaOverall,
) {
  const posicao =
    dados.posicao as PosicaoCard | null | undefined

  const pesos =
    posicao && PESOS_POR_POSICAO[posicao]
      ? PESOS_POR_POSICAO[posicao]
      : PESOS_PADRAO

  return Math.round(
    valorAtributo(dados.pac) * pesos.pac +
      valorAtributo(dados.sho) * pesos.sho +
      valorAtributo(dados.pas) * pesos.pas +
      valorAtributo(dados.dri) * pesos.dri +
      valorAtributo(dados.def) * pesos.def +
      valorAtributo(dados.phy) * pesos.phy,
  )
}

export function obterNivelCard(
  overall: number,
): NivelCard {
  if (overall >= 90) {
    return 'legend'
  }

  if (overall >= 80) {
    return 'ouro'
  }

  if (overall >= 70) {
    return 'prata'
  }

  return 'bronze'
}

export const FAIXAS_NIVEL_CARD = {
  bronze: '50–69',
  prata: '70–79',
  ouro: '80–89',
  legend: '90+',
} as const