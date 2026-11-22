import type { ImageObj } from '../../types'
import { uid } from '../../utils/id'

export interface PreparedImage {
  data: Uint8Array
  mime: 'image/png' | 'image/jpeg'
  url: string
  width: number
  height: number
}

/** Accepts PNG/JPEG directly; WebP (and others) are converted to PNG so export always works. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error('Unsupported image type. Use PNG, JPEG or WebP.')
  }
  let blob: Blob = file
  let mime: PreparedImage['mime'] = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
  const bitmap = await createImageBitmap(file)
  if (file.type === 'image/webp') {
    const c = document.createElement('canvas')
    c.width = bitmap.width
    c.height = bitmap.height
    c.getContext('2d')!.drawImage(bitmap, 0, 0)
    blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Image conversion failed.'))), 'image/png'))
    mime = 'image/png'
  }
  const data = new Uint8Array(await blob.arrayBuffer())
  const out = { data, mime, url: URL.createObjectURL(new Blob([data], { type: mime })), width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return out
}

export function makeImageObject(img: PreparedImage, pageW: number, pageH: number, at?: { x: number; y: number }): ImageObj {
  const maxW = pageW * 0.5
  const maxH = pageH * 0.5
  const k = Math.min(1, maxW / img.width, maxH / img.height)
  const w = img.width * k
  const h = img.height * k
  return {
    id: uid(), type: 'image', x: at ? at.x - w / 2 : (pageW - w) / 2, y: at ? at.y - h / 2 : (pageH - h) / 2,
    rotation: 0, opacity: 1, w, h, data: img.data, mime: img.mime, url: img.url, lockAspect: true,
  }
}
