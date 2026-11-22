import { useEffect, useRef } from 'react'
import type { RenderTask } from 'pdfjs-dist'
import type { PageModel, Source } from '../types'
import { getSourcePage } from '../services/pdf/pdfjs'

/**
 * Renders a source page into a canvas at the given CSS-pixel scale.
 * The page is always rendered unrotated; rotation is applied with CSS so
 * overlay coordinates stay in one stable space. Blank pages render nothing.
 */
export function usePageRender(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  page: PageModel,
  source: Source | undefined,
  scale: number,
  enabled: boolean,
  onRendered?: () => void,
) {
  const task = useRef<RenderTask | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!enabled) {
      // Free memory for pages far from the viewport.
      canvas.width = 0
      canvas.height = 0
      return
    }
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const cssW = page.box.w * scale
      const cssH = page.box.h * scale
      if (!page.sourceId || !source) {
        canvas.width = Math.round(cssW * dpr)
        canvas.height = Math.round(cssH * dpr)
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        onRendered?.()
        return
      }
      try {
        const p = await getSourcePage(source.id, source.doc, page.srcIndex)
        if (cancelled) return
        const viewport = p.getViewport({ scale: scale * dpr, rotation: 0 })
        // Render offscreen first so the visible canvas never flashes blank on zoom.
        const off = document.createElement('canvas')
        off.width = Math.floor(viewport.width)
        off.height = Math.floor(viewport.height)
        const ctx = off.getContext('2d')!
        task.current?.cancel()
        task.current = p.render({ canvasContext: ctx, canvas: off, viewport })
        await task.current.promise
        if (cancelled) return
        canvas.width = off.width
        canvas.height = off.height
        canvas.getContext('2d')!.drawImage(off, 0, 0)
        onRendered?.()
      } catch (e) {
        const err = e as { name?: string }
        if (err?.name !== 'RenderingCancelledException') console.error('Page render failed')
      }
    }, 120)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      task.current?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, page.srcIndex, page.sourceId, scale, enabled, source?.id])
}
