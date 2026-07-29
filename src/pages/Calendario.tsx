import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCobrancas, useDocumentos } from '@/hooks/useDados'
import { ItemCobranca } from '@/components/ItemCobranca'
import { DetalheCobranca } from '@/components/DetalheCobranca'
import { Carregando, Erro, Vazio } from '@/components/Estados'
import { dataCurta, moeda, paraIsoData } from '@/lib/format'
import { ROTULO_CATEGORIA, type Cobranca } from '@/lib/types'

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function Calendario() {
  const { empresaAtiva } = useAuth()
  const cobrancas = useCobrancas(empresaAtiva?.id ?? null)
  const documentos = useDocumentos(empresaAtiva?.id ?? null)

  const hoje = new Date()
  const [mesVisivel, setMesVisivel] = useState(
    () => new Date(hoje.getFullYear(), hoje.getMonth(), 1),
  )
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)
  const [aberta, setAberta] = useState<Cobranca | null>(null)

  /** Cobrancas indexadas pela data de vencimento (YYYY-MM-DD). */
  const porDia = useMemo(() => {
    const mapa = new Map<string, Cobranca[]>()
    for (const c of cobrancas.dados) {
      const chave = c.vencimento.slice(0, 10)
      const lista = mapa.get(chave)
      if (lista) lista.push(c)
      else mapa.set(chave, [c])
    }
    return mapa
  }, [cobrancas.dados])

  /** Celulas do grid: completa a primeira semana com nulos para alinhar. */
  const celulas = useMemo(() => {
    const primeiro = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth(), 1)
    const totalDias = new Date(
      mesVisivel.getFullYear(),
      mesVisivel.getMonth() + 1,
      0,
    ).getDate()
    const vazias = Array.from<null>({ length: primeiro.getDay() }).fill(null)
    const dias = Array.from({ length: totalDias }, (_, i) =>
      paraIsoData(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth(), i + 1)),
    )
    return [...vazias, ...dias]
  }, [mesVisivel])

  const docsDoMes = useMemo(() => {
    const prefixo = `${mesVisivel.getFullYear()}-${String(mesVisivel.getMonth() + 1).padStart(2, '0')}`
    return documentos.dados.filter(
      (d) => (d.competencia ?? d.created_at).slice(0, 7) === prefixo,
    )
  }, [documentos.dados, mesVisivel])

  const totalDoMes = useMemo(() => {
    const prefixo = `${mesVisivel.getFullYear()}-${String(mesVisivel.getMonth() + 1).padStart(2, '0')}`
    return cobrancas.dados
      .filter((c) => c.vencimento.startsWith(prefixo) && c.status === 'aberto')
      .reduce((s, c) => s + Number(c.valor), 0)
  }, [cobrancas.dados, mesVisivel])

  function mudarMes(delta: number) {
    setMesVisivel((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
    setDiaSelecionado(null)
  }

  if (!empresaAtiva) return <Vazio titulo="Nenhuma empresa vinculada ao seu acesso" />
  if (cobrancas.carregando) return <Carregando />
  if (cobrancas.erro) return <Erro mensagem={cobrancas.erro} />

  const isoHoje = paraIsoData(hoje)
  const nomeMes = mesVisivel.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Calendário</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            aria-label="Mês anterior"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-semibold capitalize text-slate-900">{nomeMes}</p>
            {totalDoMes > 0 && (
              <p className="text-xs text-slate-500">{moeda(totalDoMes)} em aberto</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            aria-label="Próximo mês"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA.map((d, i) => (
            <div key={i} className="pb-1 text-xs font-semibold text-slate-400">
              {d}
            </div>
          ))}

          {celulas.map((iso, i) => {
            if (!iso) return <div key={`v${i}`} />

            const itens = porDia.get(iso) ?? []
            const temVencido = itens.some((c) => c.status === 'aberto' && iso < isoHoje)
            const temAberto = itens.some((c) => c.status === 'aberto')
            const ehHoje = iso === isoHoje
            const selecionado = iso === diaSelecionado

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setDiaSelecionado(selecionado ? null : iso)}
                aria-label={`${dataCurta(iso)}${itens.length ? `, ${itens.length} cobrança(s)` : ''}`}
                className={`relative aspect-square rounded-lg text-sm transition ${
                  selecionado
                    ? 'bg-marca-600 font-semibold text-white'
                    : ehHoje
                      ? 'bg-marca-50 font-semibold text-marca-700'
                      : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {Number(iso.slice(8, 10))}
                {itens.length > 0 && (
                  <span
                    className={`absolute bottom-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${
                      selecionado
                        ? 'bg-white'
                        : temVencido
                          ? 'bg-red-500'
                          : temAberto
                            ? 'bg-marca-500'
                            : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <Legenda cor="bg-marca-500">Em aberto</Legenda>
          <Legenda cor="bg-red-500">Vencido</Legenda>
          <Legenda cor="bg-emerald-500">Pago</Legenda>
        </div>
      </div>

      {diaSelecionado && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            {dataCurta(diaSelecionado)}
          </h2>
          {(porDia.get(diaSelecionado) ?? []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Nada vence neste dia.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {(porDia.get(diaSelecionado) ?? []).map((c) => (
                <ItemCobranca key={c.id} cobranca={c} aoAbrir={setAberta} />
              ))}
            </div>
          )}
        </section>
      )}

      {docsDoMes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Documentos da competência
          </h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {docsDoMes.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <FileText size={18} className="shrink-0 text-slate-400" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{d.titulo}</p>
                  <p className="text-xs text-slate-500">{ROTULO_CATEGORIA[d.categoria]}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {aberta && <DetalheCobranca cobranca={aberta} aoFechar={() => setAberta(null)} />}
    </div>
  )
}

function Legenda({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${cor}`} aria-hidden />
      {children}
    </span>
  )
}
