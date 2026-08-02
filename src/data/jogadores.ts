export type Jogador = {
  id: number
  nome: string
  gols: number
  assistencias: number
  vitorias: number
  estrelas: number
}

export const jogadores: Jogador[] = [
  {
    id: 1,
    nome: 'Carlos',
    gols: 18,
    assistencias: 10,
    vitorias: 12,
    estrelas: 5,
  },
  {
    id: 2,
    nome: 'Pedro',
    gols: 15,
    assistencias: 11,
    vitorias: 9,
    estrelas: 4,
  },
  {
    id: 3,
    nome: 'Lucas',
    gols: 12,
    assistencias: 7,
    vitorias: 10,
    estrelas: 3,
  },
  {
    id: 4,
    nome: 'Rafael',
    gols: 10,
    assistencias: 8,
    vitorias: 8,
    estrelas: 2,
  },
  {
    id: 5,
    nome: 'Fernando',
    gols: 8,
    assistencias: 6,
    vitorias: 7,
    estrelas: 2,
  },
]