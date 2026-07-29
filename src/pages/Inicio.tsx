import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Receipt,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCobrancas, useDocumentos } from '@/hooks/useDados'
import { ItemCobranca } from '@/components/ItemCobranca'
import { DetalheCobranca } from '@/components/DetalheCobranca'
import { Carregando, Erro, Vazio } from '@/components/Estados'
import { diasAte, moeda, dataCurta } from '@/lib/format'
import { ROTULO_CATEGORIA, type Cobranca } from '@/lib/types'

export function Inicio() {
  const { empresaAtiva, perfil } = useAuth()
  const cobrancas = useCobrancas(empresaAtiva?.id ?? null)
  const documentos = useDocumentos(empresaAtiva?.id ?? null)
  const [aberta, setAberta] = useState<Cobranca | null>(null)

  const resumo = useMemo(() => {
    const abertas = cobrancas.dados.filter((c) => c.status === 'aberto')
    const vencidas = abertas.filter((c) => diasAte(c.vencimento) < 0)
    const proximas = abertas
      .filter((c) => diasAte(c.vencimento) >= 0)
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    return {
      abertas,
      vencidas,
      proximas,
      totalAberto: abertas.reduce((s, c) => s + Number(c.valor), 0),
    }
  }, [cobrancas.dados])

  if (!empresaAtiva) {
    return (
      <Vazio
        titulo="Nenhuma empresa vinculada ao seu acesso"
        descricao="Fale com a RD Contabilidade para liberar o acesso à sua empresa."
      />
    )
  }

  if (cobrancas.carregando) return <Carregando />
  if (cobrancas.erro) return <Erro mensagem={cobrancas.erro} />

  const primeiroNome = perfil?.nome?.trim().split(' ')[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {primeiroNome ? `Olá, ${primeiroNome}` : 'Olá'}
        </h1>
        <p className="text-sm text-slate-500">
          {empresaAtiva.nome_fantasia || empresaAtiva.razao_social}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Cartao
          rotulo="Total em aberto"
          valor={moeda(resumo.totalAberto)}
          detalhe={`${resumo.abertas.length} cobrança${resumo.abertas.length === 1 ? '' : 's'}`}
          Icone={Receipt}
        />
        <Cartao
          rotulo="Vencidas"
          valor={String(resumo.vencidas.length)}
          detalhe={
            resumo.vencidas.length > 0
              ? moeda(resumo.vencidas.reduce((s, c) => s + Number(c.valor), 0))
              : 'Tudo em dia'
          }
          Icone={resumo.vencidas.length > 0 ? AlertTriangle : CheckCircle2}
          alerta={resumo.vencidas.length > 0}
        />
        <Cartao
          rotulo="Documentos"
          valor={String(documentos.dados.length)}
          detalhe="disponíveis no portal"
          Icone={FileText}
        />
      </div>

      {resumo.vencidas.length > 0 && (
        <Secao titulo="Vencidas" para="/cobrancas">
          <div className="divide-y divide-slate-100">
            {resumo.vencidas.map((c) => (
              <ItemCobranca key={c.id} cobranca={c} aoAbrir={setAberta} />
            ))}
          </div>
        </Secao>
      )}

      <Secao titulo="Próximos vencimentos" para="/cobrancas">
        {resumo.proximas.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Nenhuma cobrança em aberto. Está tudo em dia.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {resumo.proximas.slice(0, 5).map((c) => (
              <ItemCobranca key={c.id} cobranca={c} aoAbrir={setAberta} />
            ))}
          </div>
        )}
      </Secao>

      {documentos.dados.length > 0 && (
        <Secao titulo="Documentos recentes" para="/documentos">
          <ul className="divide-y divide-slate-100">
            {documentos.dados.slice(0, 4).map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <FileText size={18} className="shrink-0 text-slate-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{d.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {ROTULO_CATEGORIA[d.categoria]} · {dataCurta(d.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Secao>
      )}

      {aberta && <DetalheCobranca cobranca={aberta} aoFechar={() => setAberta(null)} />}
    </div>
  )
}

function Cartao({
  rotulo,
  valor,
  detalhe,
  Icone,
  alerta = false,
}: {
  rotulo: string
  valor: string
  detalhe: string
  Icone: LucideIcon
  alerta?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{rotulo}</p>
        <Icone size={16} className={alerta ? 'text-red-500' : 'text-slate-400'} />
      </div>
      <p
        className={`mt-1.5 text-2xl font-bold tracking-tight ${
          alerta ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        {valor}
      </p>
      <p className="text-xs text-slate-500">{detalhe}</p>
    </div>
  )
}

function Secao({
  titulo,
  para,
  children,
}: {
  titulo: string
  para: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
        <Link
          to={para}
          className="inline-flex items-center gap-1 text-xs font-medium text-marca-600 hover:text-marca-700"
        >
          Ver tudo <ArrowRight size={13} aria-hidden />
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">{children}</div>
    </section>
  )
}
