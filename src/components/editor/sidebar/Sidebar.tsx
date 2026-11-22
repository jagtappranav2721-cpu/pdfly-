import { useRef, useState } from 'react'
import { Copy, FilePlus2, FileDown, Files, RotateCw, Trash2 } from 'lucide-react'
import IconButton from '../../common/IconButton'
import Thumb from '../pages/Thumb'
import { useEditor } from '../../../stores/editorStore'
import { openPdfBytes } from '../../../services/pdf/loader'
import type { PageModel } from '../../../types'

interface Props {
  onExtract: (page: PageModel) => void
  onError: (m: string) => void
}

export default function Sidebar({ onExtract, onError }: Props) {
  const pages = useEditor((s) => s.pages)
  const currentId = useEditor((s) => s.currentPageId)
  const open = useEditor((s) => s.sidebarOpen)
  const { setCurrentPage, addBlankPage, duplicatePage, deletePage, rotatePage, movePage, addSourcePages } = useEditor.getState()
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const merge = useRef<HTMLInputElement>(null)
  if (!open) return null

  const cur = pages.find((p) => p.id === currentId) ?? pages[0]

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
    <aside className="flex w-[148px] shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-1.5 py-1">
        <IconButton tip="Insert blank page" onClick={() => cur && addBlankPage(cur.id)}><FilePlus2 size={15} /></IconButton>
        <IconButton tip="Insert pages from another PDF" onClick={() => merge.current?.click()}><Files size={15} /></IconButton>
        <IconButton tip="Duplicate page" onClick={() => cur && duplicatePage(cur.id)}><Copy size={15} /></IconButton>
        <input
          ref={merge} type="file" hidden accept="application/pdf,.pdf"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void mergeFile(f)
            e.target.value = ''
          }}
        />
      </div>
      <div className="flex items-center justify-between border-b border-line px-1.5 py-1">
        <IconButton tip="Rotate page" onClick={() => cur && rotatePage(cur.id, 90)}><RotateCw size={15} /></IconButton>
        <IconButton tip="Download this page only" onClick={() => cur && onExtract(cur)}><FileDown size={15} /></IconButton>
        <IconButton tip="Delete page" disabled={pages.length <= 1} onClick={() => cur && deletePage(cur.id)}><Trash2 size={15} /></IconButton>
      </div>

      <div className="thin-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {pages.map((p, i) => (
          <div
            key={p.id}
            draggable
            onDragStart={() => setDragId(p.id)}
            onDragOver={(e) => { e.preventDefault(); setOverId(p.id) }}
            onDragEnd={() => { setDragId(null); setOverId(null) }}
            onDrop={() => { if (dragId) movePage(dragId, p.id); setDragId(null); setOverId(null) }}
            onClick={() => setCurrentPage(p.id)}
            className={`cursor-pointer rounded-md p-1 text-center transition-colors ${
              p.id === currentId ? 'bg-accent-soft ring-1 ring-accent' : 'hover:bg-black/[0.04]'
            } ${overId === p.id && dragId && dragId !== p.id ? 'ring-2 ring-accent/60' : ''} ${dragId === p.id ? 'opacity-40' : ''}`}
          >
            <div className="overflow-hidden rounded-[3px] border border-line shadow-sm">
              <Thumb page={p} />
            </div>
            <div className="mt-1 text-[11px] text-muted">{i + 1}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}
