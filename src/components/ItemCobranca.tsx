import { ChevronRight, QrCode, Barcode, Paperclip } from 'lucide-react'
import { EtiquetaStatus } from './Etiquetas'
import { competenciaCurta, dataCurta, moeda } from '@/lib/format'
import { ROTULO_TIPO, type Cobranca } from '@/lib/types'

export function ItemCobranca({
  cobranca,
  aoAbrir,
}: {
  cobranca: Cobranca
  aoAbrir: (c: Cobranca) => void
}) {
  return (
    <button
      type="button"
      onClick={() => aoAbrir(cobranca)}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-marca-600">
            {ROTULO_TIPO[cobranca.tipo]}
          </span>
          <EtiquetaStatus status={cobranca.status} vencimento={cobranca.vencimento} />
        </div>
        <p className="mt-0.5 line-clamp-2 font-medium text-slate-900">{cobranca.descricao}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          <span>Venc. {dataCurta(cobranca.vencimento)}</span>
          {cobranca.competencia && <span>· Comp. {competenciaCurta(cobranca.competencia)}</span>}
          {cobranca.pix_copia_cola && (
            <span className="inline-flex items-center gap-0.5" title="Pix disponível">
              · <QrCode size={12} aria-hidden /> Pix
            </span>
          )}
          {cobranca.linha_digitavel && (
            <span className="inline-flex items-center gap-0.5" title="Boleto disponível">
              · <Barcode size={12} aria-hidden /> Boleto
            </span>
          )}
          {cobranca.arquivo_path && (
            <span className="inline-flex items-center gap-0.5" title="PDF anexado">
              · <Paperclip size={12} aria-hidden /> PDF
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-slate-900">{moeda(cobranca.valor)}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-slate-300" aria-hidden />
    </button>
  )
}
