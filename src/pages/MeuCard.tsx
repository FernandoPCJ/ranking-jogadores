import {
  AlertCircle,
  CreditCard,
  Crown,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Star,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import Header from '../components/Header'
import { supabase } from '../lib/supabase'
import {
  ATRIBUTOS_CARD,
  FAIXAS_NIVEL_CARD,
  POSICOES_CARD,
  calcularOverall,
  obterNivelCard,
  type AtributoCard,
} from '../utils/overall'
import {
  REGRAS_EVOLUCAO_CARD,
} from '../utils/pontuacao'

type MeuCardDados = {
  jogador_id: number
  nome: string
  apelido: string | null
  foto_url: string | null

  gols: number
  assistencias: number
  vitorias: number
  estrelas: number

  pac: number
  sho: number
  pas: number
  dri: number
  def: number
  phy: number

  posicao: string | null
  pe_dominante: string | null

  pontos_conquistados: number
  pontos_gastos: number
  pontos_disponiveis: number
}

const PES_DOMINANTES = [
  'Direito',
  'Esquerdo',
  'Ambidestro',
] as const



const TEMAS_CARD = {
  bronze: {
    nome: 'Bronze',
    subtitulo: null,
    card:
      'border-amber-700/70 bg-gradient-to-b from-amber-950 via-stone-900 to-slate-950 shadow-amber-950/40',
    brilhoSuperior:
      'bg-amber-500/15',
    brilhoInferior:
      'bg-orange-700/10',
    destaque:
      'text-amber-400',
    textoPrincipal:
      'text-white',
    textoSecundario:
      'text-slate-400',
    textoSuave:
      'text-slate-500',
    bordaSuave:
      'border-amber-700/35',
    fundoIcone:
      'border-amber-600/30 bg-amber-700/15 text-amber-300',
    selo:
      'border-amber-600/30 bg-amber-700/15 text-amber-300',
    foto:
      'border-amber-700/35',
  },

  prata: {
    nome: 'Prata',
    subtitulo: null,
    card:
      'border-slate-300/70 bg-gradient-to-b from-slate-500 via-slate-800 to-slate-950 shadow-slate-400/20',
    brilhoSuperior:
      'bg-white/15',
    brilhoInferior:
      'bg-slate-300/10',
    destaque:
      'text-slate-100',
    textoPrincipal:
      'text-white',
    textoSecundario:
      'text-slate-300',
    textoSuave:
      'text-slate-400',
    bordaSuave:
      'border-slate-300/35',
    fundoIcone:
      'border-slate-300/35 bg-slate-200/10 text-slate-100',
    selo:
      'border-slate-300/35 bg-slate-200/10 text-slate-100',
    foto:
      'border-slate-300/30',
  },

  ouro: {
    nome: 'Ouro',
    subtitulo: null,
    card:
      'border-yellow-400/80 bg-gradient-to-b from-yellow-900 via-amber-950 to-slate-950 shadow-yellow-900/35',
    brilhoSuperior:
      'bg-yellow-300/20',
    brilhoInferior:
      'bg-amber-500/15',
    destaque:
      'text-yellow-300',
    textoPrincipal:
      'text-white',
    textoSecundario:
      'text-amber-100/70',
    textoSuave:
      'text-amber-200/50',
    bordaSuave:
      'border-yellow-400/35',
    fundoIcone:
      'border-yellow-300/35 bg-yellow-400/10 text-yellow-300',
    selo:
      'border-yellow-300/35 bg-yellow-400/10 text-yellow-300',
    foto:
      'border-yellow-400/30',
  },

  legend: {
    nome: 'LEGEND',
    subtitulo: 'CLUBE 90+',
    card:
      'border-yellow-500/80 bg-gradient-to-br from-stone-50 via-white to-amber-50 shadow-yellow-500/25',
    brilhoSuperior:
      'bg-yellow-300/25',
    brilhoInferior:
      'bg-amber-400/20',
    destaque:
      'text-amber-700',
    textoPrincipal:
      'text-slate-900',
    textoSecundario:
      'text-slate-600',
    textoSuave:
      'text-slate-500',
    bordaSuave:
      'border-amber-500/35',
    fundoIcone:
      'border-amber-500/40 bg-white/60 text-amber-700 shadow-sm',
    selo:
      'border-amber-500/45 bg-gradient-to-r from-amber-100 via-white to-yellow-100 text-amber-800 shadow-sm',
    foto:
      'border-amber-500/45 shadow-lg shadow-amber-500/10',
  },
} as const

function MeuCard() {
  const [card, setCard] =
    useState<MeuCardDados | null>(null)

  const [posicao, setPosicao] = useState('')
  const [peDominante, setPeDominante] =
    useState('')

  const [carregando, setCarregando] =
    useState(true)

  const [salvandoBasico, setSalvandoBasico] =
    useState(false)

  const [atributoAtualizando, setAtributoAtualizando] =
    useState<AtributoCard | null>(null)

  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const carregarCard = useCallback(async () => {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase.rpc(
      'obter_meu_card',
    )

    if (error) {
      console.error(
        'Erro ao carregar card:',
        error,
      )

      setCard(null)
      setErro(
        'Não foi possível carregar seu card.',
      )
      setCarregando(false)
      return
    }

    if (!data) {
      setCard(null)
      setErro(
        'Seu jogador ainda não possui um card disponível.',
      )
      setCarregando(false)
      return
    }

    const cardCarregado =
      data as MeuCardDados

    setCard(cardCarregado)
    setPosicao(cardCarregado.posicao ?? '')
    setPeDominante(
      cardCarregado.pe_dominante ?? '',
    )

    setCarregando(false)
  }, [])

  useEffect(() => {
    carregarCard()
  }, [carregarCard])

  const overall = useMemo(() => {
    if (!card) {
      return 50
    }

    return calcularOverall(card)
  }, [card])

  const nivelCard = useMemo(
    () => obterNivelCard(overall),
    [overall],
  )

  const temaCard =
    TEMAS_CARD[nivelCard]

  const ehLegend =
    nivelCard === 'legend'

  const cardConfigurado = Boolean(
    card?.posicao &&
      card?.pe_dominante,
  )

  async function salvarDadosBasicos() {
    if (cardConfigurado) {
      setErro(
        'Sua posição e seu pé dominante já foram definidos e estão bloqueados.',
      )
      return
    }

    if (!posicao || !peDominante) {
      setErro(
        'Escolha a posição e o pé dominante antes de salvar.',
      )
      return
    }

    const confirmou = window.confirm(
      `Confirmar posição ${posicao} e pé dominante ${peDominante}?\n\nDepois da confirmação, essas escolhas ficarão bloqueadas e não poderão ser alteradas pelo jogador.`,
    )

    if (!confirmou) {
      return
    }

    setSalvandoBasico(true)
    setErro('')
    setMensagem('')

    const { data, error } = await supabase.rpc(
      'atualizar_meu_card_basico',
      {
        p_posicao: posicao,
        p_pe_dominante: peDominante,
      },
    )

    if (error) {
      console.error(
        'Erro ao atualizar card:',
        error,
      )

      setErro(
        error.message ||
          'Não foi possível salvar posição e pé dominante.',
      )
      setSalvandoBasico(false)
      return
    }

    if (data) {
      const cardAtualizado =
        data as MeuCardDados

      setCard(cardAtualizado)
      setPosicao(
        cardAtualizado.posicao ?? '',
      )
      setPeDominante(
        cardAtualizado.pe_dominante ?? '',
      )
    }

    setMensagem(
      'Posição e pé dominante confirmados. A evolução dos atributos foi liberada.',
    )
    setSalvandoBasico(false)
  }

  async function gastarPonto(
    atributo: AtributoCard,
  ) {
    if (!card) {
      return
    }

    if (!cardConfigurado) {
      setErro(
        'Defina e confirme sua posição e seu pé dominante antes de evoluir os atributos.',
      )
      return
    }

    if (card.pontos_disponiveis <= 0) {
      setErro(
        'Você não possui pontos disponíveis.',
      )
      return
    }

    if (card[atributo] >= 99) {
      setErro(
        'Este atributo já atingiu o máximo de 99.',
      )
      return
    }

    const info = ATRIBUTOS_CARD.find(
      (item) => item.chave === atributo,
    )

    const confirmou = window.confirm(
      `Gastar 1 ponto em ${info?.sigla ?? atributo.toUpperCase()}?`,
    )

    if (!confirmou) {
      return
    }

    setAtributoAtualizando(atributo)
    setErro('')
    setMensagem('')

    const { data, error } = await supabase.rpc(
      'gastar_ponto_card',
      {
        p_atributo: atributo,
      },
    )

    if (error) {
      console.error(
        'Erro ao gastar ponto:',
        error,
      )

      setErro(
        error.message ||
          'Não foi possível gastar o ponto.',
      )
      setAtributoAtualizando(null)
      return
    }

    if (data) {
      const cardAtualizado =
        data as MeuCardDados

      setCard(cardAtualizado)
      setPosicao(
        cardAtualizado.posicao ?? '',
      )
      setPeDominante(
        cardAtualizado.pe_dominante ?? '',
      )
    }

    setMensagem(
      `1 ponto aplicado em ${info?.sigla ?? atributo.toUpperCase()}.`,
    )
    setAtributoAtualizando(null)
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <p className="mt-4 text-sm text-slate-400">
              Carregando seu card...
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
          <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
            <AlertCircle
              size={34}
              className="mx-auto text-red-400"
            />

            <h2 className="mt-4 text-xl font-bold">
              Card não encontrado
            </h2>

            <p className="mt-2 text-sm text-red-200/70">
              {erro}
            </p>

            <button
              type="button"
              onClick={carregarCard}
              className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <RefreshCw size={18} />
              Tentar novamente
            </button>
          </section>
        </main>
      </div>
    )
  }

  const nomeExibicao =
    card.apelido || card.nome

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        <section className="mb-8">
          <p className="text-sm font-medium text-cyan-400">
            Evolução do jogador
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            Meu Card
          </h2>

          <p className="mt-2 text-slate-400">
            Evolua seus atributos conforme seu desempenho no campeonato.
          </p>
        </section>

        {erro && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            {mensagem}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
          <section className="self-start">
            <div className={`relative mx-auto max-w-[360px] overflow-hidden rounded-[32px] border p-6 shadow-2xl transition-all duration-500 ${temaCard.card}`}>
              {ehLegend && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 opacity-70"
                    style={{
                      backgroundImage:
                        'linear-gradient(118deg, transparent 0%, transparent 24%, rgba(180, 135, 35, 0.18) 24.4%, transparent 25%, transparent 47%, rgba(212, 175, 55, 0.13) 47.5%, transparent 48.2%, transparent 71%, rgba(148, 163, 184, 0.18) 71.5%, transparent 72.2%), linear-gradient(32deg, transparent 0%, transparent 35%, rgba(148, 163, 184, 0.14) 35.4%, transparent 36%, transparent 64%, rgba(212, 175, 55, 0.14) 64.5%, transparent 65.2%)',
                    }}
                  />

                  <div className="pointer-events-none absolute inset-[7px] rounded-[26px] border border-amber-600/35" />

                  <div className="pointer-events-none absolute left-1/2 top-5 h-px w-28 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />
                </>
              )}

              <div className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl ${temaCard.brilhoSuperior}`} />
              <div className={`pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full blur-3xl ${temaCard.brilhoInferior}`} />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-5xl font-black tracking-tight ${temaCard.destaque}`}>
                      {overall}
                    </p>

                    <p className={`mt-1 text-lg font-bold ${temaCard.textoPrincipal}`}>
                      {card.posicao || 'POS'}
                    </p>

                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${temaCard.selo}`}
                      >
                        {ehLegend && (
                          <Crown size={12} />
                        )}
                        {temaCard.nome}
                      </span>

                      {temaCard.subtitulo && (
                        <p className={`mt-1.5 text-[9px] font-black uppercase tracking-[0.22em] ${temaCard.destaque}`}>
                          {temaCard.subtitulo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`rounded-xl border p-3 ${temaCard.fundoIcone}`}>
                    {ehLegend ? (
                      <Crown size={28} />
                    ) : (
                      <CreditCard size={28} />
                    )}
                  </div>
                </div>

                <div className="mt-5 flex justify-center">
                  {card.foto_url ? (
                    <img
                      src={card.foto_url}
                      alt={`Foto de ${nomeExibicao}`}
                      className={`h-48 w-48 rounded-3xl border-2 object-cover object-top ${temaCard.foto}`}
                    />
                  ) : (
                    <div className={`flex h-48 w-48 items-center justify-center rounded-3xl border-2 bg-slate-800 text-6xl font-black text-slate-500 ${temaCard.foto}`}>
                      {nomeExibicao
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="mt-5 text-center">
                  <h3 className={`truncate text-2xl font-black uppercase tracking-wide ${temaCard.textoPrincipal}`}>
                    {nomeExibicao}
                  </h3>

                  {card.apelido && (
                    <p className={`mt-1 text-xs ${temaCard.textoSecundario}`}>
                      {card.nome}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-center gap-1">
                    {Array.from({
                      length: Math.min(
                        card.estrelas,
                        5,
                      ),
                    }).map((_, indice) => (
                      <Star
                        key={indice}
                        size={16}
                        fill="currentColor"
                        className="text-yellow-400"
                      />
                    ))}

                    {card.estrelas === 0 && (
                      <span className={`text-xs ${temaCard.textoSuave}`}>
                        Sem estrelas
                      </span>
                    )}
                  </div>
                </div>

                <div className={`mt-6 grid grid-cols-2 gap-x-8 gap-y-3 border-t pt-5 ${temaCard.bordaSuave}`}>
                  {ATRIBUTOS_CARD.map(
                    ({
                      chave,
                      sigla,
                    }) => (
                      <div
                        key={chave}
                        className="flex items-center justify-between"
                      >
                        <span className={`text-lg font-black ${temaCard.textoPrincipal}`}>
                          {card[chave]}
                        </span>

                        <span className={`text-sm font-bold tracking-wider ${temaCard.destaque}`}>
                          {sigla}
                        </span>
                      </div>
                    ),
                  )}
                </div>

                <div className={`mt-6 grid grid-cols-2 gap-3 border-t pt-5 text-xs ${temaCard.bordaSuave}`}>
                  <div>
                    <p className={temaCard.textoSuave}>
                      Pé dominante
                    </p>

                    <p className={`mt-1 font-semibold ${temaCard.textoPrincipal}`}>
                      {card.pe_dominante ||
                        'Não definido'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={temaCard.textoSuave}>
                      Posição
                    </p>

                    <p className={`mt-1 font-semibold ${temaCard.textoPrincipal}`}>
                      {card.posicao ||
                        'Não definida'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mx-auto mt-3 max-w-[360px] text-center text-xs leading-5 text-slate-500">
              Overall calculado por média ponderada conforme a posição. Bronze: {FAIXAS_NIVEL_CARD.bronze}, Prata: {FAIXAS_NIVEL_CARD.prata}, Ouro: {FAIXAS_NIVEL_CARD.ouro} e Legend: {FAIXAS_NIVEL_CARD.legend}.
            </p>
          </section>

          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-xs uppercase tracking-wider text-emerald-400">
                  Conquistados
                </p>

                <strong className="mt-2 block text-3xl">
                  {card.pontos_conquistados}
                </strong>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Gastos
                </p>

                <strong className="mt-2 block text-3xl">
                  {card.pontos_gastos}
                </strong>
              </article>

              <article className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
                <p className="text-xs uppercase tracking-wider text-cyan-400">
                  Disponíveis
                </p>

                <strong className="mt-2 block text-3xl text-cyan-300">
                  {card.pontos_disponiveis}
                </strong>
              </article>
            </div>

            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div>
                <h3 className="text-xl font-bold">
                  Informações do jogador
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  {cardConfigurado
                    ? 'Suas escolhas foram confirmadas e estão bloqueadas.'
                    : 'Escolha sua posição e seu pé dominante. Após confirmar, não será possível alterá-los.'}
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="posicao-card"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Posição
                  </label>

                  <select
                    id="posicao-card"
                    value={posicao}
                    disabled={cardConfigurado}
                    onChange={(event) =>
                      setPosicao(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500"
                  >
                    <option value="">
                      Selecione
                    </option>

                    {POSICOES_CARD.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pe-card"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Pé dominante
                  </label>

                  <select
                    id="pe-card"
                    value={peDominante}
                    disabled={cardConfigurado}
                    onChange={(event) =>
                      setPeDominante(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500"
                  >
                    <option value="">
                      Selecione
                    </option>

                    {PES_DOMINANTES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              {cardConfigurado ? (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                  <Lock
                    size={20}
                    className="mt-0.5 shrink-0 text-emerald-400"
                  />

                  <div>
                    <p className="font-semibold text-emerald-300">
                      Escolhas confirmadas
                    </p>

                    <p className="mt-1 text-sm leading-5 text-emerald-200/70">
                      Posição e pé dominante estão bloqueados. Caso seja necessária uma correção excepcional, ela deverá ser feita pelo administrador.
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={salvarDadosBasicos}
                  disabled={
                    salvandoBasico ||
                    !posicao ||
                    !peDominante
                  }
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvandoBasico ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700/30 border-t-slate-950" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Confirmar escolhas
                    </>
                  )}
                </button>
              )}
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    Evoluir atributos
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {cardConfigurado
                      ? 'Cada melhoria consome 1 ponto disponível.'
                      : 'A evolução fica bloqueada até você confirmar posição e pé dominante.'}
                  </p>
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-center">
                  <p className="text-xs text-cyan-400">
                    Pontos disponíveis
                  </p>

                  <strong className="text-2xl text-cyan-300">
                    {card.pontos_disponiveis}
                  </strong>
                </div>
              </div>

              {!cardConfigurado && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
                  <Lock
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-400"
                  />

                  <p className="text-sm leading-5 text-amber-200">
                    Defina e confirme sua posição e seu pé dominante para liberar os botões de evolução.
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ATRIBUTOS_CARD.map(
                  ({
                    chave,
                    sigla,
                    nome,
                  }) => {
                    const noMaximo =
                      card[chave] >= 99

                    const semPontos =
                      card.pontos_disponiveis <=
                      0

                    const atualizando =
                      atributoAtualizando ===
                      chave

                    return (
                      <div
                        key={chave}
                        className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white">
                              {card[chave]}
                            </span>

                            <span className="font-bold text-cyan-400">
                              {sigla}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {nome}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            gastarPonto(chave)
                          }
                          disabled={
                            !cardConfigurado ||
                            noMaximo ||
                            semPontos ||
                            atributoAtualizando !==
                              null
                          }
                          title={
                            !cardConfigurado
                              ? 'Confirme posição e pé dominante primeiro'
                              : noMaximo
                                ? 'Atributo no máximo'
                                : semPontos
                                  ? 'Sem pontos disponíveis'
                                  : `Aumentar ${sigla}`
                          }
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
                        >
                          {atualizando ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          ) : (
                            <Plus size={20} />
                          )}
                        </button>
                      </div>
                    )
                  },
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-xl font-bold">
                Como o Overall é calculado
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                O Overall considera sua posição. Atributos mais importantes
                para a função em campo têm peso maior no cálculo.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-amber-700/25 bg-amber-900/10 p-4">
                  <p className="text-xs uppercase tracking-wider text-amber-500">
                    Bronze
                  </p>

                  <strong className="mt-1 block text-xl text-amber-300">
                    {FAIXAS_NIVEL_CARD.bronze} OVR
                  </strong>
                </div>

                <div className="rounded-xl border border-slate-400/25 bg-slate-400/10 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    Prata
                  </p>

                  <strong className="mt-1 block text-xl text-slate-100">
                    {FAIXAS_NIVEL_CARD.prata} OVR
                  </strong>
                </div>

                <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/10 p-4">
                  <p className="text-xs uppercase tracking-wider text-yellow-400">
                    Ouro
                  </p>

                  <strong className="mt-1 block text-xl text-yellow-300">
                    {FAIXAS_NIVEL_CARD.ouro} OVR
                  </strong>
                </div>

                <div className="rounded-xl border border-amber-300/35 bg-gradient-to-br from-stone-50/10 via-yellow-100/10 to-amber-300/10 p-4">
                  <div className="flex items-center gap-2">
                    <Crown
                      size={15}
                      className="text-yellow-300"
                    />

                    <p className="text-xs font-black uppercase tracking-wider text-yellow-300">
                      Legend
                    </p>
                  </div>

                  <strong className="mt-1 block text-xl text-yellow-200">
                    {FAIXAS_NIVEL_CARD.legend} OVR
                  </strong>
                </div>
              </div>

              {!card.posicao && (
                <p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
                  Enquanto você não escolher uma posição, o sistema usa a
                  média simples dos seis atributos.
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="font-bold">
                Como ganhar pontos
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-950/50 p-4">
                  <strong className="text-emerald-400">
                    {REGRAS_EVOLUCAO_CARD.golsPorPonto} gols
                  </strong>
                  <p className="mt-1 text-sm text-slate-500">
                    +1 ponto
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/50 p-4">
                  <strong className="text-purple-400">
                    {REGRAS_EVOLUCAO_CARD.assistenciasPorPonto} assistências
                  </strong>
                  <p className="mt-1 text-sm text-slate-500">
                    +1 ponto
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/50 p-4">
                  <strong className="text-amber-400">
                    {REGRAS_EVOLUCAO_CARD.vitoriasPorPonto} vitórias
                  </strong>
                  <p className="mt-1 text-sm text-slate-500">
                    +1 ponto
                  </p>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  )
}

export default MeuCard