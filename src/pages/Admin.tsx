import { useState } from 'react'
import { Building2, FileUp, Loader2, Receipt } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Erro } from '@/components/Estados'
import { BUCKET, supabase } from '@/lib/supabase'
import { cnpjValido, mascaraCnpj } from '@/lib/format'
import {
  ROTULO_CATEGORIA,
  ROTULO_REGIME,
  ROTULO_TIPO,
  type CategoriaDocumento,
  type RegimeTributario,
  type TipoCobranca,
} from '@/lib/types'

type Aba = 'cobranca' | 'documento' | 'empresa'

/** Remove acentos e caracteres que o Storage do Supabase rejeita na chave. */
function nomeSeguro(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80)
}

export function Admin() {
  const { ehAdmin } = useAuth()
  const [aba, setAba] = useState<Aba>('cobranca')

  if (!ehAdmin) {
    return <Erro mensagem="Esta área é restrita à equipe do escritório." />
  }

  const abas: { chave: Aba; rotulo: string; Icone: typeof Receipt }[] = [
    { chave: 'cobranca', rotulo: 'Publicar guia', Icone: Receipt },
    { chave: 'documento', rotulo: 'Enviar documento', Icone: FileUp },
    { chave: 'empresa', rotulo: 'Nova empresa', Icone: Building2 },
  ]

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Painel do escritório</h1>

      <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
        {abas.map(({ chave, rotulo, Icone }) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
              aba === chave
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icone size={15} aria-hidden />
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'cobranca' && <FormCobranca />}
      {aba === 'documento' && <FormDocumento />}
      {aba === 'empresa' && <FormEmpresa />}
    </div>
  )
}

// ------------------------------------------------------------------
// Publicar guia / boleto
// ------------------------------------------------------------------

function FormCobranca() {
  const { empresas, perfil } = useAuth()
  const [empresaId, setEmpresaId] = useState('')
  const [tipo, setTipo] = useState<TipoCobranca>('das')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [competencia, setCompetencia] = useState('')
  const [pix, setPix] = useState('')
  const [linha, setLinha] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const { estado, erro, ok, executar, limparAviso } = useEnvio()

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    await executar(async () => {
      const alvo = empresaId || empresas[0]?.id
      if (!alvo) throw new Error('Cadastre uma empresa antes de publicar uma guia.')

      let arquivoPath: string | null = null
      if (arquivo) {
        arquivoPath = `${alvo}/cobrancas/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(arquivoPath, arquivo, { contentType: arquivo.type || undefined })
        if (error) throw new Error(`Falha ao enviar o arquivo: ${error.message}`)
      }

      const { error } = await supabase.from('cobrancas').insert({
        empresa_id: alvo,
        tipo,
        descricao: descricao.trim(),
        valor: Number(valor.replace(',', '.')),
        vencimento,
        competencia: competencia ? `${competencia}-01` : null,
        pix_copia_cola: pix.trim() || null,
        linha_digitavel: linha.replace(/\D/g, '') || null,
        observacoes: observacoes.trim() || null,
        arquivo_path: arquivoPath,
        criado_por: perfil?.id ?? null,
      })
      if (error) throw new Error(error.message)

      setDescricao('')
      setValor('')
      setPix('')
      setLinha('')
      setObservacoes('')
      setArquivo(null)
      return 'Guia publicada. O cliente já consegue ver no portal.'
    })
  }

  return (
    <Cartao aoEnviar={enviar} estado={estado} erro={erro} ok={ok} limparAviso={limparAviso}>
      <SelectEmpresa valor={empresaId} onChange={setEmpresaId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Tipo">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCobranca)}
            className={ENTRADA}
          >
            {Object.entries(ROTULO_TIPO).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Valor (R$)">
          <input
            required
            inputMode="decimal"
            placeholder="0,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={ENTRADA}
          />
        </Campo>
      </div>

      <Campo rotulo="Descrição">
        <input
          required
          placeholder="Ex.: DAS Simples Nacional 03/2026"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={ENTRADA}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Vencimento">
          <input
            required
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className={ENTRADA}
          />
        </Campo>
        <Campo rotulo="Competência" dica="Mês de referência">
          <input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className={ENTRADA}
          />
        </Campo>
      </div>

      <Campo rotulo="Pix copia e cola" dica="O QR Code é gerado automaticamente a partir deste código">
        <textarea
          rows={3}
          placeholder="00020126..."
          value={pix}
          onChange={(e) => setPix(e.target.value)}
          className={`${ENTRADA} font-mono text-xs`}
        />
      </Campo>

      <Campo rotulo="Linha digitável do boleto" dica="Só os números; a formatação é automática">
        <input
          inputMode="numeric"
          placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
          value={linha}
          onChange={(e) => setLinha(e.target.value)}
          className={`${ENTRADA} font-mono text-xs`}
        />
      </Campo>

      <Campo rotulo="Arquivo da guia (PDF)" opcional>
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className={ARQUIVO}
        />
      </Campo>

      <Campo rotulo="Observação para o cliente" opcional>
        <input
          placeholder="Ex.: pagar até o dia 20 para evitar multa"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className={ENTRADA}
        />
      </Campo>
    </Cartao>
  )
}

// ------------------------------------------------------------------
// Enviar documento
// ------------------------------------------------------------------

function FormDocumento() {
  const { empresas, perfil } = useAuth()
  const [empresaId, setEmpresaId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDocumento>('fiscal')
  const [competencia, setCompetencia] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const { estado, erro, ok, executar, limparAviso } = useEnvio()

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    await executar(async () => {
      const alvo = empresaId || empresas[0]?.id
      if (!alvo) throw new Error('Cadastre uma empresa antes de enviar documentos.')
      if (!arquivo) throw new Error('Selecione o arquivo.')

      const caminho = `${alvo}/documentos/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`
      const { error: erroUpload } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo, { contentType: arquivo.type || undefined })
      if (erroUpload) throw new Error(`Falha ao enviar o arquivo: ${erroUpload.message}`)

      const { error } = await supabase.from('documentos').insert({
        empresa_id: alvo,
        titulo: titulo.trim() || arquivo.name,
        categoria,
        competencia: competencia ? `${competencia}-01` : null,
        arquivo_path: caminho,
        tamanho_bytes: arquivo.size,
        criado_por: perfil?.id ?? null,
      })
      if (error) throw new Error(error.message)

      setTitulo('')
      setArquivo(null)
      return 'Documento publicado no portal do cliente.'
    })
  }

  return (
    <Cartao aoEnviar={enviar} estado={estado} erro={erro} ok={ok} limparAviso={limparAviso}>
      <SelectEmpresa valor={empresaId} onChange={setEmpresaId} />

      <Campo rotulo="Título" dica="Se ficar vazio, usamos o nome do arquivo">
        <input
          placeholder="Ex.: Balanço patrimonial 2025"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className={ENTRADA}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Categoria">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}
            className={ENTRADA}
          >
            {Object.entries(ROTULO_CATEGORIA).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Competência" opcional>
          <input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className={ENTRADA}
          />
        </Campo>
      </div>

      <Campo rotulo="Arquivo">
        <input
          required
          type="file"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className={ARQUIVO}
        />
      </Campo>
    </Cartao>
  )
}

// ------------------------------------------------------------------
// Nova empresa
// ------------------------------------------------------------------

function FormEmpresa() {
  const { recarregar } = useAuth()
  const [razao, setRazao] = useState('')
  const [fantasia, setFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [regime, setRegime] = useState<RegimeTributario>('simples')
  const { estado, erro, ok, executar, limparAviso } = useEnvio()

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    await executar(async () => {
      const limpo = cnpj.replace(/\D/g, '')
      if (!cnpjValido(limpo)) throw new Error('CNPJ inválido. Confira os números.')

      const { error } = await supabase.from('empresas').insert({
        razao_social: razao.trim(),
        nome_fantasia: fantasia.trim() || null,
        cnpj: limpo,
        regime_tributario: regime,
      })
      if (error) {
        throw new Error(
          error.code === '23505'
            ? 'Já existe uma empresa cadastrada com este CNPJ.'
            : error.message,
        )
      }

      setRazao('')
      setFantasia('')
      setCnpj('')
      await recarregar()
      return 'Empresa cadastrada.'
    })
  }

  return (
    <Cartao aoEnviar={enviar} estado={estado} erro={erro} ok={ok} limparAviso={limparAviso}>
      <Campo rotulo="Razão social">
        <input
          required
          value={razao}
          onChange={(e) => setRazao(e.target.value)}
          className={ENTRADA}
        />
      </Campo>

      <Campo rotulo="Nome fantasia" opcional>
        <input
          value={fantasia}
          onChange={(e) => setFantasia(e.target.value)}
          className={ENTRADA}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="CNPJ">
          <input
            required
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            onBlur={() => setCnpj((v) => mascaraCnpj(v))}
            className={ENTRADA}
          />
        </Campo>
        <Campo rotulo="Regime tributário">
          <select
            value={regime}
            onChange={(e) => setRegime(e.target.value as RegimeTributario)}
            className={ENTRADA}
          >
            {Object.entries(ROTULO_REGIME).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
        Depois de cadastrar a empresa, crie o usuário do cliente em{' '}
        <strong>Authentication → Users</strong> no painel do Supabase e vincule os dois na
        tabela <code className="font-mono">acessos</code>. O passo a passo está no README.
      </p>
    </Cartao>
  )
}

// ------------------------------------------------------------------
// Pecas compartilhadas
// ------------------------------------------------------------------

const ENTRADA =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100'

const ARQUIVO =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-marca-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-marca-700'

/** Estado compartilhado de envio dos formularios do painel. */
function useEnvio() {
  const [estado, setEstado] = useState<'parado' | 'enviando'>('parado')
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function executar(acao: () => Promise<string>) {
    setEstado('enviando')
    setErro(null)
    setOk(null)
    try {
      setOk(await acao())
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Algo deu errado. Tente novamente.')
    } finally {
      setEstado('parado')
    }
  }

  function limparAviso() {
    setErro(null)
    setOk(null)
  }

  return { estado, erro, ok, executar, limparAviso }
}

function Cartao({
  aoEnviar,
  estado,
  erro,
  ok,
  limparAviso,
  children,
}: {
  aoEnviar: (e: React.FormEvent) => void
  estado: 'parado' | 'enviando'
  erro: string | null
  ok: string | null
  limparAviso: () => void
  children: React.ReactNode
}) {
  return (
    <form
      onSubmit={aoEnviar}
      onChange={limparAviso}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      {children}

      {erro && <Erro mensagem={erro} />}
      {ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {ok}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-marca-600 px-4 py-2.5 font-semibold text-white transition hover:bg-marca-700 disabled:opacity-60 sm:w-auto"
      >
        {estado === 'enviando' && <Loader2 className="animate-spin" size={18} />}
        {estado === 'enviando' ? 'Enviando…' : 'Salvar'}
      </button>
    </form>
  )
}

function SelectEmpresa({
  valor,
  onChange,
}: {
  valor: string
  onChange: (v: string) => void
}) {
  const { empresas } = useAuth()
  return (
    <Campo rotulo="Empresa">
      <select
        required
        value={valor || empresas[0]?.id || ''}
        onChange={(e) => onChange(e.target.value)}
        className={ENTRADA}
      >
        {empresas.length === 0 && <option value="">Nenhuma empresa cadastrada</option>}
        {empresas.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome_fantasia || e.razao_social} — {mascaraCnpj(e.cnpj)}
          </option>
        ))}
      </select>
    </Campo>
  )
}

function Campo({
  rotulo,
  dica,
  opcional,
  children,
}: {
  rotulo: string
  dica?: string
  opcional?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {rotulo}
        {opcional && <span className="ml-1 font-normal text-slate-400">(opcional)</span>}
      </span>
      {children}
      {dica && <span className="mt-1 block text-xs text-slate-500">{dica}</span>}
    </label>
  )
}
