import { useRef } from 'react'
import type { PageModel } from '../../../types'
import { useEditor } from '../../../stores/editorStore'
import { useVisible } from '../../../hooks/useVisible'
import { usePageRender } from '../../../hooks/usePageRender'

export const THUMB_W = 104

/** Small, lazily rendered page preview (base page content only). */
export default function Thumb({ page }: { page: PageModel }) {
  const source = useEditor((s) => (page.sourceId ? s.sources[page.sourceId] : undefined))
  const { ref, visible } = useVisible<HTMLDivElement>(400)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotated = page.rotation % 180 !== 0
  const pw = rotated ? page.box.h : page.box.w
  const ph = rotated ? page.box.w : page.box.h
  const k = THUMB_W / pw
  usePageRender(canvasRef, page, source, k, visible)

  const w = page.box.w * k
  const h = page.box.h * k
  return (
    <div ref={ref} className="relative mx-auto bg-white" style={{ width: THUMB_W, height: ph * k }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', width: w, height: h,
          left: (THUMB_W - w) / 2, top: (ph * k - h) / 2,
          transform: page.rotation ? `rotate(${page.rotation}deg)` : undefined,
        }}
      />
    </div>
  )
}
