import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { mascaraCnpj } from '@/lib/format'

const ITENS = [
  { para: '/', rotulo: 'Início', Icone: LayoutDashboard },
  { para: '/cobrancas', rotulo: 'Guias', Icone: Receipt },
  { para: '/documentos', rotulo: 'Documentos', Icone: FileText },
  { para: '/calendario', rotulo: 'Calendário', Icone: CalendarDays },
]

export function Layout() {
  const { perfil, empresas, empresaAtiva, selecionarEmpresa, ehAdmin, sair } = useAuth()

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-marca-600 font-bold text-white">
              RD
            </div>
            <div className="min-w-0">
              {empresas.length > 1 ? (
                <select
                  aria-label="Empresa"
                  value={empresaAtiva?.id ?? ''}
                  onChange={(e) => selecionarEmpresa(e.target.value)}
                  className="max-w-full truncate rounded-md border-none bg-transparent p-0 text-sm font-semibold text-slate-900 focus:ring-0"
                >
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome_fantasia || e.razao_social}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="truncate text-sm font-semibold text-slate-900">
                  {empresaAtiva
                    ? empresaAtiva.nome_fantasia || empresaAtiva.razao_social
                    : 'Nenhuma empresa vinculada'}
                </p>
              )}
              <p className="truncate text-xs text-slate-500">
                {empresaAtiva ? mascaraCnpj(empresaAtiva.cnpj) : perfil?.nome}
              </p>
            </div>
          </div>

          {ehAdmin && (
            <NavLink
              to="/admin"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
            >
              <Settings size={15} aria-hidden />
              Painel
            </NavLink>
          )}
          <button
            type="button"
            onClick={() => void sair()}
            aria-label="Sair"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut size={18} />
          </button>
        </div>

        <nav className="mx-auto hidden max-w-5xl gap-1 px-4 sm:flex">
          {ITENS.map(({ para, rotulo, Icone }) => (
            <NavLink
              key={para}
              to={para}
              end={para === '/'}
              className={({ isActive }) =>
                `-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'border-marca-600 text-marca-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icone size={16} aria-hidden />
              {rotulo}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 pb-24 sm:pb-10">
        <Outlet />
      </main>

      {/* Navegacao inferior: no celular o polegar alcanca melhor embaixo. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5">
          {ITENS.map(({ para, rotulo, Icone }) => (
            <NavLink
              key={para}
              to={para}
              end={para === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-marca-700' : 'text-slate-500'
                }`
              }
            >
              <Icone size={20} aria-hidden />
              {rotulo}
            </NavLink>
          ))}
          {ehAdmin ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-marca-700' : 'text-slate-500'
                }`
              }
            >
              <Building2 size={20} aria-hidden />
              Painel
            </NavLink>
          ) : (
            <span />
          )}
        </div>
      </nav>
    </div>
  )
}
