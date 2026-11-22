import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import Toolbar from './toolbar/Toolbar'
import Sidebar from './sidebar/Sidebar'
import Canvas from './canvas/Canvas'
import BottomBar from './canvas/BottomBar'
import PropertiesPanel from './properties/PropertiesPanel'
import ExportDialog from './ExportDialog'
import { useEditor } from '../../stores/editorStore'
import type { PageModel } from '../../types'

export default function Editor() {
  const [exporting, setExporting] = useState<{ pages: PageModel[]; suffix: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Keyboard shortcuts (ignored while typing in a field or editing text).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)
      const st = useEditor.getState()
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault()
        e.shiftKey ? st.redo() : st.undo()
      } else if (mod && e.key.toLowerCase() === 'y' && !typing) {
        e.preventDefault()
        st.redo()
      } else if (!typing && (e.key === 'Delete' || e.key === 'Backspace') && st.selected) {
        e.preventDefault()
        st.checkpoint()
        st.removeObject(st.selected.pageId, st.selected.objId)
      } else if (!typing && e.key === 'Escape') {
        st.select(null)
        st.setTool('select')
      } else if (!typing && !mod && e.key.toLowerCase() === 'v') {
        st.setTool('select')
      } else if (!typing && !mod && e.key.toLowerCase() === 't') {
        st.setTool('edit-text')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Warn before closing the tab with unexported edits.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().past.length) e.preventDefault()
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])

  return (
    <div className="flex h-full flex-col bg-bg">
      <Toolbar
        onError={setError}
        onExport={() => setExporting({ pages: useEditor.getState().pages, suffix: '-edited' })}
      />
      {error && (
        <div className="flex items-center justify-between border-b border-danger/20 bg-danger/5 px-4 py-1.5 text-xs text-danger">
          {error}
          <button aria-label="Dismiss" onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <Sidebar onError={setError} onExtract={(p) => setExporting({ pages: [p], suffix: '-page' })} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Canvas />
          <BottomBar />
        </div>
        <PropertiesPanel onError={setError} />
      </div>
      {exporting && <ExportDialog pages={exporting.pages} suffix={exporting.suffix} onClose={() => setExporting(null)} />}
    </div>
  )
}
