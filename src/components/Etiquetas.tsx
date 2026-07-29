import { diasAte } from '@/lib/format'
import type { StatusCobranca } from '@/lib/types'

export function EtiquetaStatus({
  status,
  vencimento,
}: {
  status: StatusCobranca
  vencimento: string
}) {
  if (status === 'pago') {
    return <Pilula cor="emerald">Pago</Pilula>
  }
  if (status === 'cancelado') {
    return <Pilula cor="slate">Cancelado</Pilula>
  }

  const dias = diasAte(vencimento)
  if (dias < 0) return <Pilula cor="red">Vencido</Pilula>
  if (dias <= 3) return <Pilula cor="amber">Vence logo</Pilula>
  return <Pilula cor="marca">Em aberto</Pilula>
}

const CORES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  marca: 'bg-marca-50 text-marca-700 ring-marca-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
} as const

export function Pilula({
  cor = 'slate',
  children,
}: {
  cor?: keyof typeof CORES
  children: React.ReactNode
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${CORES[cor]}`}
    >
      {children}
    </span>
  )
}
