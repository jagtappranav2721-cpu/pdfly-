import { useEffect, useRef, useState } from 'react'
import {
  Bookmark,
  Copy,
  FilePlus2,
  FileDown,
  Files,
  LayoutList,
  RotateCw,
  Trash2,
} from 'lucide-react'
import IconButton from '../../common/IconButton'
import Thumb from '../pages/Thumb'
import { useEditor } from '../../../stores/editorStore'
import { openPdfBytes } from '../../../services/pdf/loader'
import type { PageModel } from '../../../types'

interface Props {
  onExtract: (page: PageModel) => void
  onError: (m: string) => void
}

interface OutlineItem {
  title: string
  dest?: unknown
  items?: OutlineItem[]
  pageIndex?: number
}

export default function Sidebar({ onExtract, onError }: Props) {
  const pages = useEditor((s) => s.pages)
  const currentId = useEditor((s) => s.currentPageId)
  const sources = useEditor((s) => s.sources)
  const open = useEditor((s) => s.sidebarOpen)
  const {
    setCurrentPage,
    addBlankPage,
    duplicatePage,
    deletePage,
    rotatePage,
    movePage,
    addSourcePages,
  } = useEditor.getState()

  const [activeTab, setActiveTab] = useState<'pages' | 'outline'>('pages')
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const merge = useRef<HTMLInputElement>(null)

  const cur = pages.find((p) => p.id === currentId) ?? pages[0]

  // Load document outline / bookmarks if available
  useEffect(() => {
    const primarySource = Object.values(sources)[0]
    if (!primarySource?.doc) return
    primarySource.doc.getOutline().then(async (outlines) => {
      if (!outlines || outlines.length === 0) {
        setOutline([])
        return
      }
      // Resolve page indexes for destinations where possible
      const resolved: OutlineItem[] = []
      for (const item of outlines) {
        let pageIndex: number | undefined
        if (typeof item.dest === 'string') {
          try {
            const destArr = await primarySource.doc.getDestination(item.dest)
            if (destArr && destArr[0]) {
              const ref = destArr[0]
              pageIndex = await primarySource.doc.getPageIndex(ref)
            }
          } catch {
            /* ignore */
          }
        }
        resolved.push({
          title: item.title,
          pageIndex,
        })
      }
      setOutline(resolved)
    }).catch(() => setOutline([]))
  }, [sources])

  if (!open) return null

  const mergeFile = async (file: File) => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const { source, pages: np } = await openPdfBytes(bytes, file.name)
      addSourcePages(source, np, cur?.id)
      setCurrentPage(np[0].id)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not add that PDF.')
    }
  }

  return (
    <aside className="absolute md:relative z-20 h-full flex w-[164px] shrink-0 flex-col border-r border-line bg-surface shadow-lg md:shadow-none transition-all">
      {/* Tab Switcher if Outline exists */}
      {outline.length > 0 && (
        <div className="flex border-b border-line bg-toolbar p-1">
          <button
            onClick={() => setActiveTab('pages')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-colors ${
              activeTab === 'pages' ? 'bg-surface text-ink shadow-2xs' : 'text-muted hover:text-ink'
            }`}
          >
            <LayoutList size={13} /> Pages
          </button>
          <button
            onClick={() => setActiveTab('outline')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-colors ${
              activeTab === 'outline' ? 'bg-surface text-ink shadow-2xs' : 'text-muted hover:text-ink'
            }`}
          >
            <Bookmark size={13} /> Outline
          </button>
        </div>
      )}

      {/* Page Action Tools */}
      <div className="flex items-center justify-between border-b border-line px-2 py-1.5">
        <IconButton tip="Insert blank page" onClick={() => cur && addBlankPage(cur.id)}>
          <FilePlus2 size={15} />
        </IconButton>
        <IconButton tip="Insert pages from another PDF" onClick={() => merge.current?.click()}>
          <Files size={15} />
        </IconButton>
        <IconButton tip="Duplicate page" onClick={() => cur && duplicatePage(cur.id)}>
          <Copy size={15} />
        </IconButton>
        <input
          ref={merge}
          type="file"
          hidden
          accept="application/pdf,.pdf"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void mergeFile(f)
            e.target.value = ''
          }}
        />
        <IconButton tip="Rotate page 90°" onClick={() => cur && rotatePage(cur.id, 90)}>
          <RotateCw size={15} />
        </IconButton>
        <IconButton tip="Export this page only" onClick={() => cur && onExtract(cur)}>
          <FileDown size={15} />
        </IconButton>
        <IconButton
          tip="Delete page"
          disabled={pages.length <= 1}
          onClick={() => cur && deletePage(cur.id)}
        >
          <Trash2 size={15} />
        </IconButton>
      </div>

      {/* Pages List View */}
      {activeTab === 'pages' ? (
        <div className="thin-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-2.5 py-3">
          {pages.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragOver={(e) => {
                e.preventDefault()
                setOverId(p.id)
              }}
              onDragEnd={() => {
                setDragId(null)
                setOverId(null)
              }}
              onDrop={() => {
                if (dragId) movePage(dragId, p.id)
                setDragId(null)
                setOverId(null)
              }}
              onClick={() => setCurrentPage(p.id)}
              className={`group cursor-pointer rounded-lg p-1.5 text-center transition-all ${
                p.id === currentId
                  ? 'bg-accent-soft ring-1.5 ring-accent shadow-xs'
                  : 'hover:bg-toolbar'
              } ${overId === p.id && dragId && dragId !== p.id ? 'ring-2 ring-accent' : ''} ${
                dragId === p.id ? 'opacity-40' : ''
              }`}
            >
              <div className="overflow-hidden rounded-md border border-line bg-white shadow-xs">
                <Thumb page={p} />
              </div>
              <div className="mt-1 text-[11px] font-medium text-muted group-hover:text-ink">
                Page {i + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Document Outline / Bookmarks View */
        <div className="thin-scroll min-h-0 flex-1 space-y-1 overflow-y-auto p-2 text-xs">
          {outline.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (typeof item.pageIndex === 'number' && pages[item.pageIndex]) {
                  setCurrentPage(pages[item.pageIndex].id)
                }
              }}
              className="flex w-full items-start gap-1.5 rounded-md px-2 py-1.5 text-left text-muted hover:bg-toolbar hover:text-ink transition-colors"
            >
              <Bookmark size={12} className="mt-0.5 shrink-0 text-accent" />
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}
