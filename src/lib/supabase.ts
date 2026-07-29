import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Faltam as variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. ' +
      'Copie .env.example para .env e preencha com os dados do seu projeto Supabase.',
  )
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const BUCKET = 'arquivos'

/** Gera uma URL temporaria (1h) para abrir/baixar um arquivo do bucket privado. */
export async function urlAssinada(caminho: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, 60 * 60)
  if (error || !data) throw error ?? new Error('Nao foi possivel gerar o link do arquivo.')
  return data.signedUrl
}
