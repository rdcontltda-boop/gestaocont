import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="animate-spin" size={18} aria-hidden />
      {texto}
    </div>
  )
}

export function Vazio({
  icone,
  titulo,
  descricao,
}: {
  icone?: ReactNode
  titulo: string
  descricao?: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icone && <div className="mb-3 flex justify-center text-slate-400">{icone}</div>}
      <p className="font-medium text-slate-700">{titulo}</p>
      {descricao && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{descricao}</p>}
    </div>
  )
}

export function Erro({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {mensagem}
    </div>
  )
}
