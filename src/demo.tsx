/**
 * Pagina de conferencia visual dos componentes, com dados ficticios.
 * Nao entra no app: serve para revisar layout sem precisar de login.
 * Acesse com `npm run dev` em /demo.html
 */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ItemCobranca } from '@/components/ItemCobranca'
import { DetalheCobranca } from '@/components/DetalheCobranca'
import { QrPix } from '@/components/QrPix'
import { BotaoCopiar } from '@/components/BotaoCopiar'
import { EtiquetaStatus } from '@/components/Etiquetas'
import { paraIsoData } from '@/lib/format'
import type { Cobranca } from '@/lib/types'
import './index.css'

const hoje = new Date()
const dia = (delta: number) =>
  paraIsoData(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + delta))

const PIX_EXEMPLO =
  '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-3456-a789-0123456789ab5204000053039865802BR5913RD CONTABILIDADE6008BRASILIA62070503***6304ABCD'

const base: Omit<Cobranca, 'id' | 'tipo' | 'descricao' | 'valor' | 'vencimento' | 'status'> = {
  empresa_id: 'demo',
  competencia: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`,
  pago_em: null,
  pix_copia_cola: PIX_EXEMPLO,
  linha_digitavel: '34191790010104351004791020150008291070026000',
  arquivo_path: null,
  observacoes: null,
  criado_por: null,
  created_at: new Date().toISOString(),
}

const EXEMPLOS: Cobranca[] = [
  {
    ...base,
    id: '1',
    tipo: 'das',
    descricao: 'DAS Simples Nacional',
    valor: 1284.57,
    vencimento: dia(6),
    status: 'aberto',
  },
  {
    ...base,
    id: '2',
    tipo: 'honorarios',
    descricao: 'Honorários contábeis',
    valor: 890,
    vencimento: dia(2),
    status: 'aberto',
    observacoes: 'Pagar até o dia 10 para manter o desconto combinado.',
  },
  {
    ...base,
    id: '3',
    tipo: 'fgts',
    descricao: 'FGTS competência anterior',
    valor: 437.19,
    vencimento: dia(-9),
    status: 'aberto',
  },
  {
    ...base,
    id: '4',
    tipo: 'darf',
    descricao: 'DARF IRPJ trimestral',
    valor: 2310.4,
    vencimento: dia(-25),
    status: 'pago',
    pago_em: dia(-24),
  },
]

function Demo() {
  const [aberta, setAberta] = useState<Cobranca | null>(null)

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="text-lg font-semibold">Etiquetas de status</h1>
      <div className="flex flex-wrap gap-2">
        <EtiquetaStatus status="aberto" vencimento={dia(10)} />
        <EtiquetaStatus status="aberto" vencimento={dia(2)} />
        <EtiquetaStatus status="aberto" vencimento={dia(-5)} />
        <EtiquetaStatus status="pago" vencimento={dia(-30)} />
        <EtiquetaStatus status="cancelado" vencimento={dia(-30)} />
      </div>

      <h1 className="text-lg font-semibold">Lista de cobranças</h1>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {EXEMPLOS.map((c) => (
          <ItemCobranca key={c.id} cobranca={c} aoAbrir={setAberta} />
        ))}
      </div>

      <h1 className="text-lg font-semibold">QR do Pix + copiar</h1>
      <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <QrPix valor={PIX_EXEMPLO} tamanho={140} />
        <BotaoCopiar texto={PIX_EXEMPLO} rotulo="Copiar código Pix" />
      </div>

      {aberta && <DetalheCobranca cobranca={aberta} aoFechar={() => setAberta(null)} />}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Demo />)
