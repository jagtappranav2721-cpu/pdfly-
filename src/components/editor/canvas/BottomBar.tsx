import { ChevronLeft, ChevronRight, MoveHorizontal, Maximize, Minus, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react'
import IconButton from '../../common/IconButton'
import { BASE_SCALE, useEditor } from '../../../stores/editorStore'

export default function BottomBar() {
  const pages = useEditor((s) => s.pages)
  const currentId = useEditor((s) => s.currentPageId)
  const scale = useEditor((s) => s.scale)
  const fitMode = useEditor((s) => s.fitMode)
  const sidebarOpen = useEditor((s) => s.sidebarOpen)
  const { setScale, setFitMode, setCurrentPage, toggleSidebar } = useEditor.getState()
  const idx = Math.max(0, pages.findIndex((p) => p.id === currentId))

  const go = (i: number) => {
    const p = pages[Math.min(pages.length - 1, Math.max(0, i))]
    if (p) setCurrentPage(p.id)
  }

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-t border-line bg-surface px-2">
      <IconButton tip={sidebarOpen ? 'Hide pages' : 'Show pages'} tipPos="up" onClick={toggleSidebar}>
        {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
      </IconButton>

      <div className="flex items-center gap-1 text-xs text-muted">
        <IconButton tip="Previous page" tipPos="up" disabled={idx <= 0} onClick={() => go(idx - 1)}><ChevronLeft size={15} /></IconButton>
        <span className="min-w-[56px] text-center tabular-nums text-ink">{idx + 1} / {pages.length}</span>
        <IconButton tip="Next page" tipPos="up" disabled={idx >= pages.length - 1} onClick={() => go(idx + 1)}><ChevronRight size={15} /></IconButton>
      </div>

      <div className="flex items-center gap-1 text-xs">
        <IconButton tip="Zoom out" tipPos="up" onClick={() => setScale(scale / 1.15)}><Minus size={15} /></IconButton>
        <span className="w-11 text-center tabular-nums">{Math.round((scale / BASE_SCALE) * 100)}%</span>
        <IconButton tip="Zoom in" tipPos="up" onClick={() => setScale(scale * 1.15)}><Plus size={15} /></IconButton>
        <IconButton tip="Fit width" tipPos="up" active={fitMode === 'width'} onClick={() => setFitMode('width')}><MoveHorizontal size={15} /></IconButton>
        <IconButton tip="Fit page" tipPos="up" active={fitMode === 'page'} onClick={() => setFitMode('page')}><Maximize size={15} /></IconButton>
      </div>
    </div>
  )
}
