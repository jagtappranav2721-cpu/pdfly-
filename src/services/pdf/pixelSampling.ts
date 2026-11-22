const hex = (n: number) => n.toString(16).padStart(2, '0')
export const toHex = (r: number, g: number, b: number) => `#${hex(r)}${hex(g)}${hex(b)}`

export interface Rect { x: number; y: number; w: number; h: number }

export interface SampleResult {
  background: string
  text: string
  textEstimated: boolean
}

/**
 * Estimates the background and text colour of a region by reading the already
 * rendered page canvas. `region` is in pt (top-left origin); canvas pixels per
 * pt are derived from the canvas size. Colours are estimates, not PDF data.
 */
export function sampleColors(canvas: HTMLCanvasElement, pageW: number, pageH: number, region: Rect): SampleResult {
  const fallback: SampleResult = { background: '#ffffff', text: '#000000', textEstimated: true }
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx || canvas.width === 0) return fallback
  const sx = canvas.width / pageW
  const sy = canvas.height / pageH
  const clampX = (v: number) => Math.max(0, Math.min(canvas.width - 1, Math.round(v)))
  const clampY = (v: number) => Math.max(0, Math.min(canvas.height - 1, Math.round(v)))
  const x0 = clampX(region.x * sx)
  const y0 = clampY(region.y * sy)
  const x1 = clampX((region.x + region.w) * sx)
  const y1 = clampY((region.y + region.h) * sy)
  if (x1 <= x0 || y1 <= y0) return fallback

  const pad = 2
  const ax = clampX(x0 - pad)
  const ay = clampY(y0 - pad)
  const bx = clampX(x1 + pad)
  const by = clampY(y1 + pad)
  let data: ImageData
  try {
    data = ctx.getImageData(ax, ay, bx - ax + 1, by - ay + 1)
  } catch {
    return fallback
  }
  const W = data.width
  const H = data.height
  const inner = (x: number, y: number) => x + ax >= x0 && x + ax <= x1 && y + ay >= y0 && y + ay <= y1

  // Background = most common quantised colour on the ring just outside the text box.
  const bins = new Map<number, { n: number; r: number; g: number; b: number }>()
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (inner(x, y)) continue
      const i = (y * W + x) * 4
      const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2]
      const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
      const e = bins.get(k) ?? { n: 0, r: 0, g: 0, b: 0 }
      e.n++; e.r += r; e.g += g; e.b += b
      bins.set(k, e)
    }
  }
  let best: { n: number; r: number; g: number; b: number } | null = null
  for (const e of bins.values()) if (!best || e.n > best.n) best = e
  const bg = best ? [Math.round(best.r / best.n), Math.round(best.g / best.n), Math.round(best.b / best.n)] : [255, 255, 255]

  // Text = pixel inside the box that differs most from the background.
  let maxD = 0
  let tc = [0, 0, 0]
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!inner(x, y)) continue
      const i = (y * W + x) * 4
      const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2]
      const d = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2])
      if (d > maxD) { maxD = d; tc = [r, g, b] }
    }
  }
  return {
    background: toHex(bg[0], bg[1], bg[2]),
    text: maxD < 90 ? '#000000' : toHex(tc[0], tc[1], tc[2]),
    textEstimated: true,
  }
}
