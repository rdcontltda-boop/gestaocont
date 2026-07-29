import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Desenha o QR Code a partir do proprio texto do Pix copia e cola.
 * Nao precisamos armazenar imagem: o BR Code ja carrega tudo.
 */
export function QrPix({ valor, tamanho = 200 }: { valor: string; tamanho?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let vivo = true
    setErro(false)
    QRCode.toDataURL(valor, {
      width: tamanho,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => vivo && setDataUrl(url))
      .catch(() => vivo && setErro(true))
    return () => {
      vivo = false
    }
  }, [valor, tamanho])

  if (erro) {
    return (
      <div
        className="grid place-items-center rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500"
        style={{ width: tamanho, height: tamanho }}
      >
        Não foi possível gerar o QR Code. Use o botão de copiar.
      </div>
    )
  }

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse rounded-lg bg-slate-200"
        style={{ width: tamanho, height: tamanho }}
      />
    )
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code do Pix"
      width={tamanho}
      height={tamanho}
      className="rounded-lg border border-slate-200 bg-white"
    />
  )
}
