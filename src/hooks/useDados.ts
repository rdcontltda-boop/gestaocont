import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cobranca, Documento } from '@/lib/types'

interface Resultado<T> {
  dados: T[]
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

/**
 * Busca genérica por empresa. O RLS no banco ja garante o isolamento;
 * o filtro aqui e so para nao trazer dado de outras empresas do admin.
 */
function useLista<T>(tabela: 'cobrancas' | 'documentos', empresaId: string | null, ordem: string) {
  const [dados, setDados] = useState<T[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [gatilho, setGatilho] = useState(0)

  const recarregar = useCallback(() => setGatilho((n) => n + 1), [])

  useEffect(() => {
    if (!empresaId) {
      setDados([])
      setCarregando(false)
      return
    }
    let vivo = true
    setCarregando(true)
    setErro(null)

    supabase
      .from(tabela)
      .select('*')
      .eq('empresa_id', empresaId)
      .order(ordem, { ascending: false })
      .then(({ data, error }) => {
        if (!vivo) return
        if (error) setErro('Não foi possível carregar os dados. Tente novamente.')
        else setDados((data as T[]) ?? [])
        setCarregando(false)
      })

    return () => {
      vivo = false
    }
  }, [tabela, empresaId, ordem, gatilho])

  return { dados, carregando, erro, recarregar } satisfies Resultado<T>
}

export function useCobrancas(empresaId: string | null) {
  return useLista<Cobranca>('cobrancas', empresaId, 'vencimento')
}

export function useDocumentos(empresaId: string | null) {
  return useLista<Documento>('documentos', empresaId, 'created_at')
}
