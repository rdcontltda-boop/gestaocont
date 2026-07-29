export type Papel = 'admin' | 'cliente'

export type RegimeTributario = 'mei' | 'simples' | 'presumido' | 'real'

export type TipoCobranca =
  | 'das'
  | 'darf'
  | 'fgts'
  | 'inss'
  | 'iss'
  | 'honorarios'
  | 'outro'

export type StatusCobranca = 'aberto' | 'pago' | 'cancelado'

export type CategoriaDocumento =
  | 'fiscal'
  | 'contabil'
  | 'folha'
  | 'societario'
  | 'certidao'
  | 'outro'

export interface Perfil {
  id: string
  nome: string
  papel: Papel
  telefone: string | null
  created_at: string
}

export interface Empresa {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string
  regime_tributario: RegimeTributario | null
  ativo: boolean
  created_at: string
}

export interface Cobranca {
  id: string
  empresa_id: string
  tipo: TipoCobranca
  descricao: string
  competencia: string | null
  vencimento: string
  valor: number
  status: StatusCobranca
  pago_em: string | null
  pix_copia_cola: string | null
  linha_digitavel: string | null
  arquivo_path: string | null
  observacoes: string | null
  criado_por: string | null
  created_at: string
}

export interface Documento {
  id: string
  empresa_id: string
  titulo: string
  categoria: CategoriaDocumento
  competencia: string | null
  arquivo_path: string
  tamanho_bytes: number | null
  visto_em: string | null
  criado_por: string | null
  created_at: string
}

export const ROTULO_TIPO: Record<TipoCobranca, string> = {
  das: 'DAS',
  darf: 'DARF',
  fgts: 'FGTS',
  inss: 'INSS',
  iss: 'ISS',
  honorarios: 'Honorários',
  outro: 'Outro',
}

export const ROTULO_CATEGORIA: Record<CategoriaDocumento, string> = {
  fiscal: 'Fiscal',
  contabil: 'Contábil',
  folha: 'Folha de pagamento',
  societario: 'Societário',
  certidao: 'Certidão',
  outro: 'Outro',
}

export const ROTULO_REGIME: Record<RegimeTributario, string> = {
  mei: 'MEI',
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
}
