import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Empresa, Perfil } from '@/lib/types'

interface EstadoAuth {
  session: Session | null
  perfil: Perfil | null
  empresas: Empresa[]
  empresaAtiva: Empresa | null
  carregando: boolean
  ehAdmin: boolean
  selecionarEmpresa: (id: string) => void
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
  recarregar: () => Promise<void>
}

const Ctx = createContext<EstadoAuth | null>(null)

const CHAVE_EMPRESA = 'gestaocont.empresa'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaId, setEmpresaId] = useState<string | null>(
    () => localStorage.getItem(CHAVE_EMPRESA),
  )
  const [carregando, setCarregando] = useState(true)

  const carregarDados = useCallback(async (ativa: Session | null) => {
    if (!ativa) {
      setPerfil(null)
      setEmpresas([])
      return
    }
    const [{ data: p }, { data: e }] = await Promise.all([
      supabase.from('perfis').select('*').eq('id', ativa.user.id).maybeSingle(),
      supabase.from('empresas').select('*').eq('ativo', true).order('razao_social'),
    ])
    setPerfil((p as Perfil) ?? null)
    setEmpresas((e as Empresa[]) ?? [])
  }, [])

  useEffect(() => {
    let vivo = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!vivo) return
      setSession(data.session)
      await carregarDados(data.session)
      if (vivo) setCarregando(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nova) => {
      setSession(nova)
      // O callback do Supabase nao deve conter await em chamadas ao banco:
      // ele roda dentro do lock de auth e travaria a renovacao do token.
      void carregarDados(nova)
    })

    return () => {
      vivo = false
      sub.subscription.unsubscribe()
    }
  }, [carregarDados])

  const selecionarEmpresa = useCallback((id: string) => {
    setEmpresaId(id)
    localStorage.setItem(CHAVE_EMPRESA, id)
  }, [])

  const entrar = useCallback(async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })
    if (error) throw error
  }, [])

  const sair = useCallback(async () => {
    localStorage.removeItem(CHAVE_EMPRESA)
    setEmpresaId(null)
    await supabase.auth.signOut()
  }, [])

  const recarregar = useCallback(async () => {
    await carregarDados(session)
  }, [carregarDados, session])

  const empresaAtiva = useMemo(() => {
    if (empresas.length === 0) return null
    return empresas.find((e) => e.id === empresaId) ?? empresas[0]
  }, [empresas, empresaId])

  const valor = useMemo<EstadoAuth>(
    () => ({
      session,
      perfil,
      empresas,
      empresaAtiva,
      carregando,
      ehAdmin: perfil?.papel === 'admin',
      selecionarEmpresa,
      entrar,
      sair,
      recarregar,
    }),
    [
      session,
      perfil,
      empresas,
      empresaAtiva,
      carregando,
      selecionarEmpresa,
      entrar,
      sair,
      recarregar,
    ],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAuth(): EstadoAuth {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return ctx
}
