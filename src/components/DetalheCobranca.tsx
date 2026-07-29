import { useEffect, useState } from 'react'
import { Barcode, Download, QrCode, X } from 'lucide-react'
import { BotaoCopiar } from './BotaoCopiar'
import { QrPix } from './QrPix'
import { EtiquetaStatus } from './Etiquetas'
import { Erro } from './Estados'
import { urlAssinada } from '@/lib/supabase'
import {
  competenciaLonga,
  dataCurta,
  formatarLinhaDigitavel,
  moeda,
  prazoEmPalavras,
} from '@/lib/format'
import { ROTULO_TIPO, type Cobranca } from '@/lib/types'

/**
 * Painel de pagamento. E a tela mais usada do portal: o cliente abre,
 * copia o Pix ou a linha digitavel e paga. Tudo com um toque.
 */
export function DetalheCobranca({
  cobranca,
  aoFechar,
}: {
  cobranca: Cobranca
  aoFechar: () => void
}) {
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)
  const [baixando, setBaixando] = useState(false)

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [aoFechar])

  async function abrirArquivo() {
    if (!cobranca.arquivo_path) return
    setBaixando(true)
    setErroArquivo(null)
    try {
      window.open(await urlAssinada(cobranca.arquivo_path), '_blank', 'noopener')
    } catch {
      setErroArquivo('Não foi possível abrir o arquivo. Tente novamente.')
    } finally {
      setBaixando(false)
    }
  }

  const pago = cobranca.status === 'pago'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={cobranca.descricao}
      onClick={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-marca-600">
              {ROTULO_TIPO[cobranca.tipo]}
            </p>
            <h2 className="truncate text-lg font-semibold text-slate-900">
              {cobranca.descricao}
            </h2>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {moeda(cobranca.valor)}
              </span>
              <EtiquetaStatus status={cobranca.status} vencimento={cobranca.vencimento} />
            </div>
            <dl className="mt-3 space-y-1 text-sm">
              <Linha rotulo="Vencimento">
                {dataCurta(cobranca.vencimento)}
                {!pago && (
                  <span className="ml-2 text-slate-500">
                    ({prazoEmPalavras(cobranca.vencimento)})
                  </span>
                )}
              </Linha>
              <Linha rotulo="Competência">{competenciaLonga(cobranca.competencia)}</Linha>
              {pago && cobranca.pago_em && (
                <Linha rotulo="Pago em">{dataCurta(cobranca.pago_em)}</Linha>
              )}
            </dl>
          </div>

          {cobranca.observacoes && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {cobranca.observacoes}
            </p>
          )}

          {!pago && cobranca.pix_copia_cola && (
            <section>
              <Titulo icone={<QrCode size={16} />}>Pagar com Pix</Titulo>
              <div className="mt-3 flex flex-col items-center gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start">
                <QrPix valor={cobranca.pix_copia_cola} tamanho={168} />
                <div className="w-full min-w-0 space-y-3">
                  <p className="text-sm text-slate-600">
                    Aponte a câmera do app do banco para o código, ou copie e cole na
                    opção <strong>Pix Copia e Cola</strong>.
                  </p>
                  <p className="break-all rounded-lg bg-slate-50 p-2.5 font-mono text-[11px] leading-relaxed text-slate-600">
                    {cobranca.pix_copia_cola}
                  </p>
                  <BotaoCopiar
                    texto={cobranca.pix_copia_cola}
                    rotulo="Copiar código Pix"
                    className="w-full"
                  />
                </div>
              </div>
            </section>
          )}

          {!pago && cobranca.linha_digitavel && (
            <section>
              <Titulo icone={<Barcode size={16} />}>Pagar com boleto</Titulo>
              <div className="mt-3 space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-600">Linha digitável:</p>
                <p className="select-all break-all rounded-lg bg-slate-50 p-2.5 font-mono text-sm tracking-tight text-slate-800">
                  {formatarLinhaDigitavel(cobranca.linha_digitavel)}
                </p>
                <BotaoCopiar
                  texto={cobranca.linha_digitavel.replace(/\D/g, '')}
                  rotulo="Copiar linha digitável"
                  className="w-full"
                />
              </div>
            </section>
          )}

          {cobranca.arquivo_path && (
            <div>
              <button
                type="button"
                onClick={abrirArquivo}
                disabled={baixando}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <Download size={16} aria-hidden />
                {baixando ? 'Abrindo…' : 'Abrir guia em PDF'}
              </button>
              {erroArquivo && (
                <div className="mt-3">
                  <Erro mensagem={erroArquivo} />
                </div>
              )}
            </div>
          )}

          {!pago && !cobranca.pix_copia_cola && !cobranca.linha_digitavel && !cobranca.arquivo_path && (
            <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Esta cobrança ainda não tem forma de pagamento cadastrada. Fale com o
              escritório.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Titulo({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
      <span className="text-marca-600" aria-hidden>
        {icone}
      </span>
      {children}
    </h3>
  )
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{rotulo}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  )
}
