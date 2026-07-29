import { useMemo, useState } from 'react'
import { Receipt } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCobrancas } from '@/hooks/useDados'
import { ItemCobranca } from '@/components/ItemCobranca'
import { DetalheCobranca } from '@/components/DetalheCobranca'
import { Carregando, Erro, Vazio } from '@/components/Estados'
import { competenciaLonga, diasAte, moeda } from '@/lib/format'
import type { Cobranca } from '@/lib/types'

type Filtro = 'aberto' | 'pago' | 'todos'

const FILTROS: { chave: Filtro; rotulo: string }[] = [
  { chave: 'aberto', rotulo: 'Em aberto' },
  { chave: 'pago', rotulo: 'Pagas' },
  { chave: 'todos', rotulo: 'Todas' },
]

export function Cobrancas() {
  const { empresaAtiva } = useAuth()
  const { dados, carregando, erro } = useCobrancas(empresaAtiva?.id ?? null)
  const [filtro, setFiltro] = useState<Filtro>('aberto')
  const [aberta, setAberta] = useState<Cobranca | null>(null)

  const grupos = useMemo(() => {
    const filtradas = dados.filter((c) =>
      filtro === 'todos' ? true : filtro === 'aberto' ? c.status === 'aberto' : c.status === 'pago',
    )

    // Em aberto: o que vence primeiro aparece primeiro.
    // Historico: o mais recente primeiro.
    filtradas.sort((a, b) =>
      filtro === 'aberto'
        ? a.vencimento.localeCompare(b.vencimento)
        : b.vencimento.localeCompare(a.vencimento),
    )

    const mapa = new Map<string, Cobranca[]>()
    for (const c of filtradas) {
      const chave = c.competencia ?? c.vencimento.slice(0, 7) + '-01'
      const lista = mapa.get(chave)
      if (lista) lista.push(c)
      else mapa.set(chave, [c])
    }
    return [...mapa.entries()]
  }, [dados, filtro])

  const totalFiltrado = useMemo(
    () => grupos.flatMap(([, cs]) => cs).reduce((s, c) => s + Number(c.valor), 0),
    [grupos],
  )

  if (!empresaAtiva) {
    return <Vazio titulo="Nenhuma empresa vinculada ao seu acesso" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Guias e boletos</h1>
        {!carregando && grupos.length > 0 && (
          <p className="text-sm text-slate-500">
            Total: <strong className="text-slate-800">{moeda(totalFiltrado)}</strong>
          </p>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {FILTROS.map(({ chave, rotulo }) => (
          <button
            key={chave}
            type="button"
            onClick={() => setFiltro(chave)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              filtro === chave
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <Erro mensagem={erro} />
      ) : grupos.length === 0 ? (
        <Vazio
          icone={<Receipt size={28} />}
          titulo={filtro === 'aberto' ? 'Nada em aberto' : 'Nenhuma cobrança encontrada'}
          descricao={
            filtro === 'aberto'
              ? 'Quando o escritório publicar uma guia, ela aparece aqui.'
              : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          {grupos.map(([competencia, itens]) => (
            <section key={competencia}>
              <h2 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{competenciaLonga(competencia)}</span>
                <span className="font-normal normal-case tracking-normal">
                  {moeda(itens.reduce((s, c) => s + Number(c.valor), 0))}
                </span>
              </h2>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {itens.map((c) => (
                  <ItemCobranca key={c.id} cobranca={c} aoAbrir={setAberta} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!carregando && filtro === 'aberto' && dados.some((c) => diasAte(c.vencimento) < 0 && c.status === 'aberto') && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Há cobranças vencidas. Se você já pagou alguma delas, envie o comprovante para
          o escritório atualizar o status.
        </p>
      )}

      {aberta && <DetalheCobranca cobranca={aberta} aoFechar={() => setAberta(null)} />}
    </div>
  )
}
