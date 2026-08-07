import {
  AlertCircle,
  Camera,
  Goal,
  Handshake,
  ImageOff,
  Pencil,
  RefreshCw,
  Save,
  Star,
  Trophy,
  UserRound,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type DadosPerfil = {
  id: string
  nome: string
  apelido: string | null
  bio: string | null
  foto_url: string | null
  jogador_id: number | null
}

type DadosJogador = {
  id: number
  nome: string
  gols: number
  assistencias: number
  vitorias: number
  estrelas: number
  ativo: boolean
}

function MeuPerfil() {
  const { sessao } = useAuth()

  const inputFotoRef =
    useRef<HTMLInputElement | null>(null)

  const [perfil, setPerfil] =
    useState<DadosPerfil | null>(null)

  const [jogador, setJogador] =
    useState<DadosJogador | null>(null)

  const [apelido, setApelido] = useState('')
  const [bio, setBio] = useState('')

  const [carregando, setCarregando] =
    useState(true)

  const [editando, setEditando] =
    useState(false)

  const [salvando, setSalvando] =
    useState(false)

  const [enviandoFoto, setEnviandoFoto] =
    useState(false)

  const [removendoFoto, setRemovendoFoto] =
    useState(false)

  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const carregarPerfil = useCallback(async () => {
    const usuarioId = sessao?.user.id

    if (!usuarioId) {
      return
    }

    setCarregando(true)
    setErro('')

    const {
      data: dadosPerfil,
      error: erroPerfil,
    } = await supabase
      .from('perfis')
      .select(
        `
          id,
          nome,
          apelido,
          bio,
          foto_url,
          jogador_id
        `,
      )
      .eq('id', usuarioId)
      .single()

    if (erroPerfil || !dadosPerfil) {
      console.error(
        'Erro ao carregar perfil:',
        erroPerfil,
      )

      setErro(
        'Não foi possível carregar seu perfil.',
      )

      setCarregando(false)
      return
    }

    const perfilCarregado =
      dadosPerfil as DadosPerfil

    setPerfil(perfilCarregado)
    setApelido(perfilCarregado.apelido ?? '')
    setBio(perfilCarregado.bio ?? '')

    if (!perfilCarregado.jogador_id) {
      setJogador(null)
      setCarregando(false)
      return
    }

    const {
      data: dadosJogador,
      error: erroJogador,
    } = await supabase
      .from('jogadores')
      .select(
        `
          id,
          nome,
          gols,
          assistencias,
          vitorias,
          estrelas,
          ativo
        `,
      )
      .eq('id', perfilCarregado.jogador_id)
      .maybeSingle()

    if (erroJogador) {
      console.error(
        'Erro ao carregar jogador:',
        erroJogador,
      )

      setErro(
        'Seu perfil foi carregado, mas não foi possível carregar suas estatísticas.',
      )

      setJogador(null)
      setCarregando(false)
      return
    }

    setJogador(
      (dadosJogador as DadosJogador | null) ??
        null,
    )

    setCarregando(false)
  }, [sessao?.user.id])

  useEffect(() => {
    carregarPerfil()
  }, [carregarPerfil])

  function cancelarEdicao() {
    setApelido(perfil?.apelido ?? '')
    setBio(perfil?.bio ?? '')
    setErro('')
    setEditando(false)
  }

  async function salvarPerfil(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const usuarioId = sessao?.user.id

    if (!usuarioId) {
      return
    }

    const apelidoFormatado = apelido.trim()
    const bioFormatada = bio.trim()

    if (apelidoFormatado.length > 40) {
      setErro(
        'O apelido pode ter no máximo 40 caracteres.',
      )
      return
    }

    if (bioFormatada.length > 300) {
      setErro(
        'A bio pode ter no máximo 300 caracteres.',
      )
      return
    }

    setSalvando(true)
    setErro('')
    setMensagem('')

    const { error } = await supabase
      .from('perfis')
      .update({
        apelido:
          apelidoFormatado.length > 0
            ? apelidoFormatado
            : null,

        bio:
          bioFormatada.length > 0
            ? bioFormatada
            : null,
      })
      .eq('id', usuarioId)

    if (error) {
      console.error(
        'Erro ao atualizar perfil:',
        error,
      )

      setErro(
        'Não foi possível salvar as alterações.',
      )

      setSalvando(false)
      return
    }

    setMensagem(
      'Perfil atualizado com sucesso.',
    )

    setSalvando(false)
    setEditando(false)

    await carregarPerfil()
  }

  function obterExtensaoDaImagem(
    arquivo: File,
  ) {
    if (arquivo.type === 'image/jpeg') {
      return 'jpg'
    }

    if (arquivo.type === 'image/png') {
      return 'png'
    }

    if (arquivo.type === 'image/webp') {
      return 'webp'
    }

    return null
  }

  async function selecionarFoto(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const arquivo = event.target.files?.[0]

    event.target.value = ''

    if (!arquivo) {
      return
    }

    const usuarioId = sessao?.user.id

    if (!usuarioId) {
      return
    }

    const extensao =
      obterExtensaoDaImagem(arquivo)

    if (!extensao) {
      setErro(
        'Escolha uma imagem JPG, PNG ou WEBP.',
      )
      return
    }

    const limite = 2 * 1024 * 1024

    if (arquivo.size > limite) {
      setErro(
        'A imagem deve possuir no máximo 2 MB.',
      )
      return
    }

    setEnviandoFoto(true)
    setErro('')
    setMensagem('')

    /*
     * Remove avatars anteriores da pasta do usuário.
     * Assim, não acumulamos avatar.jpg, avatar.png etc.
     */
    const {
      data: arquivosExistentes,
      error: erroLista,
    } = await supabase.storage
      .from('avatars')
      .list(usuarioId, {
        limit: 100,
      })

    if (erroLista) {
      console.error(
        'Erro ao listar avatars:',
        erroLista,
      )

      setErro(
        'Não foi possível preparar o envio da foto.',
      )

      setEnviandoFoto(false)
      return
    }

    if (
      arquivosExistentes &&
      arquivosExistentes.length > 0
    ) {
      const caminhos =
        arquivosExistentes.map(
          (arquivoExistente) =>
            `${usuarioId}/${arquivoExistente.name}`,
        )

      const { error: erroRemocao } =
        await supabase.storage
          .from('avatars')
          .remove(caminhos)

      if (erroRemocao) {
        console.error(
          'Erro ao remover avatar anterior:',
          erroRemocao,
        )

        setErro(
          'Não foi possível substituir sua foto anterior.',
        )

        setEnviandoFoto(false)
        return
      }
    }

    const caminho =
      `${usuarioId}/avatar.${extensao}`

    const { error: erroUpload } =
      await supabase.storage
        .from('avatars')
        .upload(caminho, arquivo, {
          upsert: true,
          contentType: arquivo.type,
          cacheControl: '3600',
        })

    if (erroUpload) {
      console.error(
        'Erro ao enviar avatar:',
        erroUpload,
      )

      setErro(
        'Não foi possível enviar sua foto.',
      )

      setEnviandoFoto(false)
      return
    }

    const { data: dadosUrl } =
      supabase.storage
        .from('avatars')
        .getPublicUrl(caminho)

    /*
     * O parâmetro evita que o navegador mostre
     * uma versão antiga da foto em cache.
     */
    const fotoUrl =
      `${dadosUrl.publicUrl}?v=${Date.now()}`

    const { error: erroAtualizacao } =
      await supabase
        .from('perfis')
        .update({
          foto_url: fotoUrl,
        })
        .eq('id', usuarioId)

    if (erroAtualizacao) {
      console.error(
        'Erro ao salvar URL do avatar:',
        erroAtualizacao,
      )

      setErro(
        'A foto foi enviada, mas não foi possível vinculá-la ao seu perfil.',
      )

      setEnviandoFoto(false)
      return
    }

    setMensagem(
      'Foto de perfil atualizada com sucesso.',
    )

    setEnviandoFoto(false)

    await carregarPerfil()
  }

  async function removerFoto() {
    const usuarioId = sessao?.user.id

    if (!usuarioId) {
      return
    }

    const confirmou = window.confirm(
      'Deseja remover sua foto de perfil?',
    )

    if (!confirmou) {
      return
    }

    setRemovendoFoto(true)
    setErro('')
    setMensagem('')

    const {
      data: arquivos,
      error: erroLista,
    } = await supabase.storage
      .from('avatars')
      .list(usuarioId, {
        limit: 100,
      })

    if (erroLista) {
      console.error(
        'Erro ao listar avatars:',
        erroLista,
      )

      setErro(
        'Não foi possível remover sua foto.',
      )

      setRemovendoFoto(false)
      return
    }

    if (arquivos && arquivos.length > 0) {
      const caminhos = arquivos.map(
        (arquivo) =>
          `${usuarioId}/${arquivo.name}`,
      )

      const { error: erroRemocao } =
        await supabase.storage
          .from('avatars')
          .remove(caminhos)

      if (erroRemocao) {
        console.error(
          'Erro ao excluir avatar:',
          erroRemocao,
        )

        setErro(
          'Não foi possível remover sua foto.',
        )

        setRemovendoFoto(false)
        return
      }
    }

    const { error: erroPerfil } =
      await supabase
        .from('perfis')
        .update({
          foto_url: null,
        })
        .eq('id', usuarioId)

    if (erroPerfil) {
      console.error(
        'Erro ao remover foto_url:',
        erroPerfil,
      )

      setErro(
        'Não foi possível atualizar seu perfil.',
      )

      setRemovendoFoto(false)
      return
    }

    setMensagem(
      'Foto de perfil removida.',
    )

    setRemovendoFoto(false)

    await carregarPerfil()
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

            <p className="mt-4 text-sm text-slate-400">
              Carregando seu perfil...
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />

        <main className="mx-auto max-w-7xl px-5 py-8">
          <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
            <AlertCircle
              size={32}
              className="mx-auto text-red-400"
            />

            <h2 className="mt-4 text-xl font-bold">
              Perfil não encontrado
            </h2>

            <button
              type="button"
              onClick={carregarPerfil}
              className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white"
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
    perfil.apelido || perfil.nome

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-8">
          <p className="text-sm font-medium text-emerald-400">
            Minha conta
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            Meu perfil
          </h2>

          <p className="mt-2 text-slate-400">
            Personalize seu perfil e acompanhe suas
            estatísticas.
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

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-center">
              <div className="relative mx-auto h-36 w-36">
                {perfil.foto_url ? (
                  <img
                    src={perfil.foto_url}
                    alt={`Foto de ${nomeExibicao}`}
                    className="h-36 w-36 rounded-full border-4 border-slate-800 object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-950 text-4xl font-bold text-slate-400">
                    {nomeExibicao
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    inputFotoRef.current?.click()
                  }
                  disabled={enviandoFoto}
                  title="Alterar foto"
                  className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-slate-900 bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  {enviandoFoto ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Camera size={19} />
                  )}
                </button>
              </div>

              <input
                ref={inputFotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={selecionarFoto}
              />

              <h3 className="mt-5 text-2xl font-bold">
                {nomeExibicao}
              </h3>

              {perfil.apelido && (
                <p className="mt-1 text-sm text-emerald-400">
                  @{perfil.apelido}
                </p>
              )}

              <p className="mt-3 text-sm text-slate-500">
                {sessao?.user.email}
              </p>

              {perfil.foto_url && (
                <button
                  type="button"
                  onClick={removerFoto}
                  disabled={removendoFoto}
                  className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                >
                  <ImageOff size={17} />

                  {removendoFoto
                    ? 'Removendo...'
                    : 'Remover foto'}
                </button>
              )}
            </div>

            <div className="mt-7 border-t border-slate-800 pt-6">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Bio
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {perfil.bio ||
                  'Este jogador ainda não adicionou uma bio.'}
              </p>
            </div>

            {!editando && (
              <button
                type="button"
                onClick={() => {
                  setErro('')
                  setMensagem('')
                  setEditando(true)
                }}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <Pencil size={18} />
                Editar perfil
              </button>
            )}
          </aside>

          <section className="space-y-6">
            {editando && (
              <form
                onSubmit={salvarPerfil}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      Editar perfil
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Você pode alterar seu apelido,
                      sua bio e sua foto.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={cancelarEdicao}
                    disabled={salvando}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  >
                    <X size={21} />
                  </button>
                </div>

                <div className="mt-6">
                  <label
                    htmlFor="apelido"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Apelido
                  </label>

                  <input
                    id="apelido"
                    type="text"
                    maxLength={40}
                    value={apelido}
                    onChange={(event) =>
                      setApelido(
                        event.target.value,
                      )
                    }
                    placeholder="Como você quer ser chamado?"
                    disabled={salvando}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />

                  <p className="mt-2 text-right text-xs text-slate-500">
                    {apelido.length}/40
                  </p>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="bio"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Bio
                  </label>

                  <textarea
                    id="bio"
                    rows={5}
                    maxLength={300}
                    value={bio}
                    onChange={(event) =>
                      setBio(event.target.value)
                    }
                    placeholder="Conte um pouco sobre você..."
                    disabled={salvando}
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />

                  <p className="mt-2 text-right text-xs text-slate-500">
                    {bio.length}/300
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelarEdicao}
                    disabled={salvando}
                    className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {salvando ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Salvar alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {jogador ? (
              <>
                <section>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-emerald-400">
                      Campeonato
                    </p>

                    <h3 className="mt-1 text-2xl font-bold">
                      Minhas estatísticas
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Estes valores são controlados pelos
                      administradores.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Goal size={22} />
                      </div>

                      <p className="mt-4 text-sm text-slate-400">
                        Gols
                      </p>

                      <strong className="mt-1 block text-3xl">
                        {jogador.gols}
                      </strong>
                    </article>

                    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                        <Handshake size={22} />
                      </div>

                      <p className="mt-4 text-sm text-slate-400">
                        Assistências
                      </p>

                      <strong className="mt-1 block text-3xl">
                        {jogador.assistencias}
                      </strong>
                    </article>

                    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <Trophy size={22} />
                      </div>

                      <p className="mt-4 text-sm text-slate-400">
                        Vitórias
                      </p>

                      <strong className="mt-1 block text-3xl">
                        {jogador.vitorias}
                      </strong>
                    </article>

                    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                        <Star size={22} />
                      </div>

                      <p className="mt-4 text-sm text-slate-400">
                        Estrelas
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <strong className="text-3xl">
                          {jogador.estrelas}
                        </strong>

                        <Star
                          size={20}
                          fill="currentColor"
                          className="text-yellow-400"
                        />
                      </div>
                    </article>
                  </div>
                </section>

                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex items-center gap-3">
                    <UserRound
                      size={22}
                      className="text-emerald-400"
                    />

                    <div>
                      <p className="text-sm text-slate-500">
                        Jogador vinculado
                      </p>

                      <p className="font-bold">
                        {jogador.nome}
                      </p>
                    </div>
                  </div>
                </article>
              </>
            ) : (
              <section className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-8">
                <AlertCircle
                  size={30}
                  className="text-amber-400"
                />

                <h3 className="mt-4 text-xl font-bold">
                  Perfil ainda não vinculado
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  Sua conta foi criada normalmente, mas
                  ainda não está vinculada a um jogador do
                  campeonato. Um administrador precisa fazer
                  esse vínculo para que suas estatísticas
                  apareçam aqui.
                </p>
              </section>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default MeuPerfil