import { useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minus,
  MoveHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Save,
} from 'lucide-react'
import IconButton from '../../common/IconButton'
import { BASE_SCALE, useEditor } from '../../../stores/editorStore'

export default function BottomBar() {
  const pages = useEditor((s) => s.pages)
  const currentId = useEditor((s) => s.currentPageId)
  const scale = useEditor((s) => s.scale)
  const fitMode = useEditor((s) => s.fitMode)
  const sidebarOpen = useEditor((s) => s.sidebarOpen)
  const saveStatus = useEditor((s) => s.saveStatus)
  const { setScale, setFitMode, setCurrentPage, toggleSidebar } = useEditor.getState()

  const [inputVal, setInputVal] = useState('')
  const [isEditingPage, setIsEditingPage] = useState(false)

  const idx = Math.max(0, pages.findIndex((p) => p.id === currentId))

  const go = (i: number) => {
    const p = pages[Math.min(pages.length - 1, Math.max(0, i))]
    if (p) setCurrentPage(p.id)
  }

  const handlePageJump = () => {
    const num = parseInt(inputVal, 10)
    if (!isNaN(num) && num >= 1 && num <= pages.length) {
      go(num - 1)
    }
    setIsEditingPage(false)
  }

  return (
    <footer className="flex h-11 shrink-0 items-center justify-between border-t border-line bg-toolbar px-3 text-ink transition-colors">
      {/* Left: Sidebar Toggle & Modification Status */}
      <div className="flex items-center gap-2">
        <IconButton
          tip={sidebarOpen ? 'Hide pages panel' : 'Show pages panel'}
          tipPos="up"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </IconButton>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted">
          {saveStatus === 'saved' ? (
            <span className="flex items-center gap-1 text-success">
              <Check size={13} />
              <span>All changes saved</span>
            </span>
          ) : saveStatus === 'saving' ? (
            <span className="flex items-center gap-1 text-accent">
              <Save size={13} className="animate-spin" />
              <span>Saving…</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-500">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Unsaved changes</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Page Navigation */}
      <div className="flex items-center gap-1 text-xs text-muted">
        <IconButton tip="Previous page" tipPos="up" disabled={idx <= 0} onClick={() => go(idx - 1)}>
          <ChevronLeft size={16} />
        </IconButton>

        {isEditingPage ? (
          <input
            autoFocus
            type="number"
            min={1}
            max={pages.length}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handlePageJump}
            onKeyDown={(e) => e.key === 'Enter' && handlePageJump()}
            className="h-6 w-12 rounded border border-accent bg-surface text-center text-xs text-ink outline-hidden"
          />
        ) : (
          <button
            onClick={() => {
              setInputVal(String(idx + 1))
              setIsEditingPage(true)
            }}
            data-tip="Click to jump to page"
            data-tip-pos="up"
            className="min-w-[64px] rounded px-1.5 py-0.5 text-center font-medium tabular-nums text-ink hover:bg-black/5 dark:hover:bg-white/5"
          >
            {idx + 1} / {pages.length}
          </button>
        )}

        <IconButton
          tip="Next page"
          tipPos="up"
          disabled={idx >= pages.length - 1}
          onClick={() => go(idx + 1)}
        >
          <ChevronRight size={16} />
        </IconButton>
      </div>

      {/* Right: Zoom & Fit Controls */}
      <div className="flex items-center gap-1 text-xs">
        <IconButton tip="Zoom out" tipPos="up" onClick={() => setScale(scale / 1.15)}>
          <Minus size={15} />
        </IconButton>
        <span className="w-12 text-center font-medium tabular-nums text-ink">
          {Math.round((scale / BASE_SCALE) * 100)}%
        </span>
        <IconButton tip="Zoom in" tipPos="up" onClick={() => setScale(scale * 1.15)}>
          <Plus size={15} />
        </IconButton>
        <IconButton
          tip="Fit width"
          tipPos="up"
          active={fitMode === 'width'}
          onClick={() => setFitMode('width')}
        >
          <MoveHorizontal size={15} />
        </IconButton>
        <IconButton
          tip="Fit whole page"
          tipPos="up"
          active={fitMode === 'page'}
          onClick={() => setFitMode('page')}
        >
          <Maximize size={15} />
        </IconButton>
      </div>
    </footer>
  )
}
