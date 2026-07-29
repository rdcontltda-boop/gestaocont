import { useEffect, useRef, useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { copiar } from '@/lib/format'

interface Props {
  texto: string
  rotulo?: string
  className?: string
}

/** Botao de copiar com retorno visual - o cliente precisa ver que deu certo. */
export function BotaoCopiar({ texto, rotulo = 'Copiar', className = '' }: Props) {
  const [estado, setEstado] = useState<'parado' | 'ok' | 'erro'>('parado')
  const timer = useRef<number>()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function aoClicar() {
    const ok = await copiar(texto)
    setEstado(ok ? 'ok' : 'erro')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setEstado('parado'), 2200)
  }

  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-[0.98] disabled:opacity-60'
  const cor =
    estado === 'ok'
      ? 'bg-emerald-600 text-white'
      : estado === 'erro'
        ? 'bg-red-600 text-white'
        : 'bg-marca-600 text-white hover:bg-marca-700'

  const Icone = estado === 'ok' ? Check : estado === 'erro' ? X : Copy

  return (
    <button type="button" onClick={aoClicar} className={`${base} ${cor} ${className}`}>
      <Icone size={16} aria-hidden />
      {estado === 'ok' ? 'Copiado!' : estado === 'erro' ? 'Não foi possível copiar' : rotulo}
    </button>
  )
}
