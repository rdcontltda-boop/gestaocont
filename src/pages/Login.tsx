import { useState } from 'react'
import { Loader2, LockKeyhole } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Erro } from '@/components/Estados'

export function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await entrar(email, senha)
    } catch (falha) {
      const msg = falha instanceof Error ? falha.message : ''
      setErro(
        /invalid login credentials/i.test(msg)
          ? 'E-mail ou senha incorretos.'
          : /email not confirmed/i.test(msg)
            ? 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
            : 'Não foi possível entrar. Tente novamente em instantes.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-xl bg-marca-600 text-xl font-bold text-white">
            RD
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Portal do Cliente
          </h1>
          <p className="text-sm text-slate-500">RD Contabilidade</p>
        </div>

        <form
          onSubmit={aoEnviar}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
            />
          </div>

          {erro && <Erro mensagem={erro} />}

          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-marca-600 px-4 py-2.5 font-semibold text-white transition hover:bg-marca-700 disabled:opacity-60"
          >
            {enviando ? <Loader2 className="animate-spin" size={18} /> : <LockKeyhole size={18} />}
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="text-center text-xs text-slate-500">
            O acesso é criado pelo escritório. Se você ainda não tem senha, fale com a
            RD Contabilidade.
          </p>
        </form>
      </div>
    </div>
  )
}
