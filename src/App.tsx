import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import { Carregando } from '@/components/Estados'
import { Login } from '@/pages/Login'
import { Inicio } from '@/pages/Inicio'
import { Cobrancas } from '@/pages/Cobrancas'
import { Documentos } from '@/pages/Documentos'
import { Calendario } from '@/pages/Calendario'
import { Admin } from '@/pages/Admin'

function Rotas() {
  const { session, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50">
        <Carregando />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="cobrancas" element={<Cobrancas />} />
        <Route path="documentos" element={<Documentos />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Rotas />
    </AuthProvider>
  )
}
