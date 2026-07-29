/** Formatacoes e helpers de dominio (moeda, datas, CNPJ, boleto). */

export function moeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

/**
 * Converte 'YYYY-MM-DD' vindo do Postgres para Date no fuso local.
 * new Date('2026-03-10') seria interpretado como UTC e, a oeste de
 * Greenwich, exibiria 09/03 - por isso a data e montada campo a campo.
 */
export function dataLocal(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export function dataCurta(iso: string): string {
  return dataLocal(iso).toLocaleDateString('pt-BR')
}

export function competenciaLonga(iso: string | null): string {
  if (!iso) return '—'
  const texto = dataLocal(iso).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function competenciaCurta(iso: string | null): string {
  if (!iso) return '—'
  const d = dataLocal(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Dias entre hoje e a data (negativo = vencido). */
export function diasAte(iso: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = dataLocal(iso)
  alvo.setHours(0, 0, 0, 0)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000)
}

export function prazoEmPalavras(iso: string): string {
  const dias = diasAte(iso)
  if (dias === 0) return 'Vence hoje'
  if (dias === 1) return 'Vence amanhã'
  if (dias === -1) return 'Venceu ontem'
  if (dias < 0) return `Venceu há ${Math.abs(dias)} dias`
  return `Vence em ${dias} dias`
}

export function mascaraCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** Valida CNPJ pelos dois digitos verificadores. */
export function cnpjValido(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false

  const digito = (base: string): number => {
    let peso = base.length - 7
    let soma = 0
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * peso--
      if (peso < 2) peso = 9
    }
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  return (
    digito(d.slice(0, 12)) === Number(d[12]) &&
    digito(d.slice(0, 13)) === Number(d[13])
  )
}

/** Agrupa a linha digitavel em blocos de 5 para leitura humana. */
export function formatarLinhaDigitavel(linha: string): string {
  const d = linha.replace(/\D/g, '')
  return d.replace(/(.{5})/g, '$1 ').trim()
}

export function tamanhoArquivo(bytes: number | null): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Copia texto para a area de transferencia.
 * navigator.clipboard exige HTTPS e nem todo WebView de celular expoe -
 * o fallback com textarea + execCommand cobre esses casos.
 */
export async function copiar(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto)
      return true
    }
  } catch {
    // cai no fallback
  }
  try {
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export function primeiroDiaDoMes(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function paraIsoData(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
