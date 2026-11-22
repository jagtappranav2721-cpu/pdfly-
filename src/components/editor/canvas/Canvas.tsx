import { useEffect, useRef } from 'react'
import { useEditor } from '../../../stores/editorStore'
import PageView from './PageView'

/** Scroll area holding every page. Handles fit modes and tracks the page nearest the viewport centre. */
export default function Canvas() {
  const pages = useEditor((s) => s.pages)
  const fitMode = useEditor((s) => s.fitMode)
  const currentPageId = useEditor((s) => s.currentPageId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastScrolledTo = useRef<string | null>(null)

  // Fit-to-width / fit-to-page recalculation.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || fitMode === 'custom') return
    const apply = () => {
      const st = useEditor.getState()
      const cur = st.pages.find((p) => p.id === st.currentPageId) ?? st.pages[0]
      if (!cur) return
      const rot = cur.rotation % 180 !== 0
      const pw = rot ? cur.box.h : cur.box.w
      const ph = rot ? cur.box.w : cur.box.h
      const availW = el.clientWidth - 64
      const availH = el.clientHeight - 48
      const s = fitMode === 'width' ? availW / pw : Math.min(availW / pw, availH / ph)
      if (isFinite(s) && s > 0) st.setScale(s, fitMode)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fitMode, currentPageId, pages.length])

  // Keep the "current page" in sync with scrolling.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const mid = el.getBoundingClientRect().top + el.clientHeight * 0.4
        let best: string | null = null
        let bestD = Infinity
        el.querySelectorAll<HTMLElement>('[data-page-id]').forEach((n) => {
          const r = n.getBoundingClientRect()
          const d = mid < r.top ? r.top - mid : mid > r.bottom ? mid - r.bottom : 0
          if (d < bestD) { bestD = d; best = n.dataset.pageId ?? null }
        })
        if (best && best !== useEditor.getState().currentPageId) {
          lastScrolledTo.current = best
          useEditor.getState().setCurrentPage(best)
        }
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  // Scroll to a page chosen from the sidebar (not when the change came from scrolling).
  useEffect(() => {
    if (!currentPageId || lastScrolledTo.current === currentPageId) return
    scrollRef.current?.querySelector(`[data-page-id="${currentPageId}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [currentPageId])

  return (
    <div ref={scrollRef} className="thin-scroll min-h-0 flex-1 overflow-auto bg-[#eceef2]">
      <div className="mx-auto flex w-max min-w-full flex-col items-center gap-5 px-8 py-6">
        {pages.map((p) => (
          <PageView key={p.id} page={p} />
        ))}
      </div>
    </div>
  )
}
