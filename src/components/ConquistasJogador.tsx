import {
  CheckCircle2,
  Crown,
  Flame,
  Gem,
  Goal,
  Handshake,
  Lock,
  Medal,
  Trophy,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import {
  calcularOverall,
  obterNivelCard,
} from '../utils/overall'

type DadosConquistas = {
  jogador_id: number

  max_gols_racha: number
  max_assistencias_racha: number
  maior_sequencia_selecao: number
  selecoes_semana: number
  mvps: number
  vitorias: number

  posicao: string | null
  pe_dominante: string | null

  pac: number | null
  sho: number | null
  pas: number | null
  dri: number | null
  def: number | null
  phy: number | null

  card_configurado: boolean
}

type Conquista = {
  id: string
  nome: string
  descricao: string
  progresso: number
  meta: number
  unidade: string
  desbloqueada: boolean
  icone: React.ReactNode
  classeDesbloqueada: string
}

type Props = {
  jogadorId: number
  titulo?: string
  descricao?: string
}

function limitarProgresso(
  progresso: number,
  meta: number,
) {
  return Math.min(
    Math.max(progresso, 0),
    meta,
  )
}

function ConquistasJogador({
  jogadorId,
  titulo = 'Conquistas',
  descricao = 'Badges desbloqueadas automaticamente pelo seu desempenho nos rachas.',
}: Props) {
  const [dados, setDados] =
    useState<DadosConquistas | null>(
      null,
    )

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] =
    useState('')

  const carregar =
    useCallback(async () => {
      setCarregando(true)
      setErro('')

      const { data, error } =
        await supabase.rpc(
          'obter_conquistas_jogador',
          {
            p_jogador_id:
              jogadorId,
          },
        )

      if (error) {
        console.error(
          'Erro ao carregar conquistas:',
          error,
        )

        setDados(null)
        setErro(
          'Não foi possível carregar as conquistas.',
        )
        setCarregando(false)
        return
      }

      setDados(
        data as DadosConquistas | null,
      )

      setCarregando(false)
    }, [jogadorId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const overall =
    useMemo(() => {
      if (
        !dados ||
        !dados.card_configurado
      ) {
        return 0
      }

      return calcularOverall({
        posicao: dados.posicao,
        pac: dados.pac,
        sho: dados.sho,
        pas: dados.pas,
        dri: dados.dri,
        def: dados.def,
        phy: dados.phy,
      })
    }, [dados])

  const conquistas =
    useMemo<Conquista[]>(() => {
      if (!dados) {
        return []
      }

      const legend =
        dados.card_configurado &&
        obterNivelCard(
          overall,
        ) === 'legend'

      return [
        {
          id: 'hat-trick',
          nome: 'Hat-trick',
          descricao:
            'Marque 3 gols em um único racha.',
          progresso:
            dados.max_gols_racha,
          meta: 3,
          unidade: 'gols',
          desbloqueada:
            dados.max_gols_racha >=
            3,
          icone: <Goal size={24} />,
          classeDesbloqueada:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        },

        {
          id: 'garcom',
          nome: 'Garçom',
          descricao:
            'Dê 3 assistências em um único racha.',
          progresso:
            dados.max_assistencias_racha,
          meta: 3,
          unidade: 'assist.',
          desbloqueada:
            dados.max_assistencias_racha >=
            3,
          icone: (
            <Handshake size={24} />
          ),
          classeDesbloqueada:
            'border-purple-500/30 bg-purple-500/10 text-purple-300',
        },

        {
          id: 'em-chamas',
          nome: 'Em Chamas',
          descricao:
            'Entre na Seleção da Semana por 3 semanas consecutivas.',
          progresso:
            dados.maior_sequencia_selecao,
          meta: 3,
          unidade: 'semanas',
          desbloqueada:
            dados.maior_sequencia_selecao >=
            3,
          icone: <Flame size={24} />,
          classeDesbloqueada:
            'border-orange-500/30 bg-orange-500/10 text-orange-300',
        },

        {
          id: 'rei-da-semana',
          nome: 'Rei da Semana',
          descricao:
            'Conquiste 5 títulos de MVP da Semana.',
          progresso: dados.mvps,
          meta: 5,
          unidade: 'MVPs',
          desbloqueada:
            dados.mvps >= 5,
          icone: <Crown size={24} />,
          classeDesbloqueada:
            'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
        },

        {
          id: 'consistente',
          nome: 'Consistente',
          descricao:
            'Apareça 10 vezes na Seleção da Semana.',
          progresso:
            dados.selecoes_semana,
          meta: 10,
          unidade: 'seleções',
          desbloqueada:
            dados.selecoes_semana >=
            10,
          icone: <Medal size={24} />,
          classeDesbloqueada:
            'border-blue-500/30 bg-blue-500/10 text-blue-300',
        },

        {
          id: 'vencedor',
          nome: 'Vencedor',
          descricao:
            'Alcance 25 vitórias acumuladas.',
          progresso: dados.vitorias,
          meta: 25,
          unidade: 'vitórias',
          desbloqueada:
            dados.vitorias >= 25,
          icone: <Trophy size={24} />,
          classeDesbloqueada:
            'border-amber-500/30 bg-amber-500/10 text-amber-300',
        },

        {
          id: 'legend',
          nome: 'Legend',
          descricao:
            'Atinja Overall 90 ou superior no seu Card.',
          progresso: overall,
          meta: 90,
          unidade: 'OVR',
          desbloqueada: legend,
          icone: <Gem size={24} />,
          classeDesbloqueada:
            'border-yellow-400/40 bg-gradient-to-br from-white/10 to-amber-500/10 text-yellow-200',
        },
      ]
    }, [dados, overall])

  const desbloqueadas =
    conquistas.filter(
      (conquista) =>
        conquista.desbloqueada,
    ).length

  if (carregando) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

        <p className="mt-3 text-sm text-slate-500">
          Carregando conquistas...
        </p>
      </section>
    )
  }

  if (erro || !dados) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          {erro ||
            'Ainda não há dados de conquistas para este jogador.'}
        </p>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-purple-400">
            Progressão
          </p>

          <h3 className="mt-1 text-2xl font-bold">
            {titulo}
          </h3>

          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            {descricao}
          </p>
        </div>

        <span className="inline-flex self-start rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-300">
          {desbloqueadas}/
          {conquistas.length}{' '}
          desbloqueadas
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {conquistas.map(
          (conquista) => {
            const progresso =
              limitarProgresso(
                conquista.progresso,
                conquista.meta,
              )

            const percentual =
              conquista.meta > 0
                ? Math.min(
                    100,
                    Math.round(
                      (progresso /
                        conquista.meta) *
                        100,
                    ),
                  )
                : 0

            return (
              <article
                key={conquista.id}
                className={`relative overflow-hidden rounded-2xl border p-5 transition ${
                  conquista.desbloqueada
                    ? conquista.classeDesbloqueada
                    : 'border-slate-800 bg-slate-900 text-slate-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      conquista.desbloqueada
                        ? 'bg-current/10'
                        : 'bg-slate-950'
                    }`}
                  >
                    {conquista.icone}
                  </div>

                  {conquista.desbloqueada ? (
                    <CheckCircle2
                      size={20}
                      className="shrink-0"
                    />
                  ) : (
                    <Lock
                      size={18}
                      className="shrink-0 text-slate-600"
                    />
                  )}
                </div>

                <h4 className="mt-4 text-lg font-black">
                  {conquista.nome}
                </h4>

                <p className="mt-1 min-h-10 text-sm leading-5 opacity-75">
                  {conquista.descricao}
                </p>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                    <span>
                      {conquista.progresso}{' '}
                      {conquista.unidade}
                    </span>

                    <span>
                      Meta{' '}
                      {conquista.meta}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950/50">
                    <div
                      className={`h-full rounded-full transition-all ${
                        conquista.desbloqueada
                          ? 'bg-current'
                          : 'bg-slate-600'
                      }`}
                      style={{
                        width: `${percentual}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-widest opacity-70">
                  {conquista.desbloqueada
                    ? 'Conquista desbloqueada'
                    : 'Em progresso'}
                </p>
              </article>
            )
          },
        )}
      </div>
    </section>
  )
}

export default ConquistasJogador