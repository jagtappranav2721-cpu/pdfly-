/** Rotate a screen-space vector by -rotation (undo CSS clockwise rotation). */
export function unrotate(dx: number, dy: number, rotationDeg: number): { x: number; y: number } {
  const r = (-rotationDeg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  return { x: dx * c - dy * s, y: dx * s + dy * c }
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const round1 = (v: number) => Math.round(v * 10) / 10

export function baseName(name: string): string {
  return name.replace(/\.pdf$/i, '')
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
