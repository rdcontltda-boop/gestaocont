import { useMemo, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentos } from '@/hooks/useDados'
import { Carregando, Erro, Vazio } from '@/components/Estados'
import { Pilula } from '@/components/Etiquetas'
import { supabase, urlAssinada } from '@/lib/supabase'
import { competenciaCurta, dataCurta, tamanhoArquivo } from '@/lib/format'
import { ROTULO_CATEGORIA, type CategoriaDocumento, type Documento } from '@/lib/types'

export function Documentos() {
  const { empresaAtiva, ehAdmin } = useAuth()
  const { dados, carregando, erro, recarregar } = useDocumentos(empresaAtiva?.id ?? null)
  const [categoria, setCategoria] = useState<CategoriaDocumento | 'todas'>('todas')
  const [abrindo, setAbrindo] = useState<string | null>(null)
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)

  const categorias = useMemo(() => {
    const presentes = new Set(dados.map((d) => d.categoria))
    return [...presentes].sort()
  }, [dados])

  const visiveis = useMemo(
    () => (categoria === 'todas' ? dados : dados.filter((d) => d.categoria === categoria)),
    [dados, categoria],
  )

  async function abrir(doc: Documento) {
    setAbrindo(doc.id)
    setErroArquivo(null)
    try {
      const url = await urlAssinada(doc.arquivo_path)
      window.open(url, '_blank', 'noopener')

      // Registra a primeira abertura para o escritorio saber que o cliente viu.
      if (!doc.visto_em && !ehAdmin) {
        await supabase
          .from('documentos')
          .update({ visto_em: new Date().toISOString() })
          .eq('id', doc.id)
        recarregar()
      }
    } catch {
      setErroArquivo('Não foi possível abrir o arquivo. Tente novamente.')
    } finally {
      setAbrindo(null)
    }
  }

  if (!empresaAtiva) return <Vazio titulo="Nenhuma empresa vinculada ao seu acesso" />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Documentos</h1>

      {categorias.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Chip ativo={categoria === 'todas'} onClick={() => setCategoria('todas')}>
            Todas
          </Chip>
          {categorias.map((c) => (
            <Chip key={c} ativo={categoria === c} onClick={() => setCategoria(c)}>
              {ROTULO_CATEGORIA[c]}
            </Chip>
          ))}
        </div>
      )}

      {erroArquivo && <Erro mensagem={erroArquivo} />}

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <Erro mensagem={erro} />
      ) : visiveis.length === 0 ? (
        <Vazio
          icone={<FileText size={28} />}
          titulo="Nenhum documento por aqui"
          descricao="Quando o escritório publicar um documento da sua empresa, ele aparece nesta lista."
        />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {visiveis.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => void abrir(d)}
                disabled={abrindo === d.id}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 disabled:opacity-60"
              >
                <FileText size={20} className="shrink-0 text-marca-500" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-900">{d.titulo}</p>
                    {!d.visto_em && <Pilula cor="marca">Novo</Pilula>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {ROTULO_CATEGORIA[d.categoria]}
                    {d.competencia && ` · ${competenciaCurta(d.competencia)}`}
                    {' · '}
                    {dataCurta(d.created_at)}
                    {' · '}
                    {tamanhoArquivo(d.tamanho_bytes)}
                  </p>
                </div>
                <Download size={18} className="shrink-0 text-slate-300" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        ativo
          ? 'bg-marca-600 text-white'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}
