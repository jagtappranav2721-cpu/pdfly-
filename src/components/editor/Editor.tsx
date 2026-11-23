import { useEffect, useState, useRef } from 'react'
import { Check, Info, X } from 'lucide-react'
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
  const [feedback, setFeedback] = useState<string | null>(null)
  const feedbackTimeout = useRef<number | null>(null)

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current)
    feedbackTimeout.current = window.setTimeout(() => setFeedback(null), 1800)
  }

  // Keyboard shortcuts implementation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const isInput = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)
      const st = useEditor.getState()
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      // Save: Ctrl + S / Cmd + S
      if (mod && key === 's') {
        e.preventDefault()
        void st.saveDocument().then((success) => {
          if (success) showFeedback('Document saved')
          else setError('Save failed')
        })
        return
      }

      // Formatting shortcuts when a text object is selected or being edited
      if (mod && key === 'b') {
        if (!isInput) {
          const applied = st.toggleSelectedStyle('bold')
          if (applied) {
            e.preventDefault()
            showFeedback('Bold toggled')
          }
        }
        return
      }

      if (mod && key === 'i') {
        if (!isInput) {
          const applied = st.toggleSelectedStyle('italic')
          if (applied) {
            e.preventDefault()
            showFeedback('Italic toggled')
          }
        }
        return
      }

      if (mod && key === 'u') {
        if (!isInput) {
          const applied = st.toggleSelectedStyle('underline')
          if (applied) {
            e.preventDefault()
            showFeedback('Underline toggled')
          }
        }
        return
      }

      // Undo / Redo
      if (mod && key === 'z' && !isInput && !t.isContentEditable) {
        e.preventDefault()
        if (e.shiftKey) {
          st.redo()
          showFeedback('Redo')
        } else {
          st.undo()
          showFeedback('Undo')
        }
        return
      }

      if (mod && key === 'y' && !isInput && !t.isContentEditable) {
        e.preventDefault()
        st.redo()
        showFeedback('Redo')
        return
      }

      // Delete selected object
      if (!isInput && !t.isContentEditable && (e.key === 'Delete' || e.key === 'Backspace') && st.selected) {
        e.preventDefault()
        st.checkpoint()
        st.removeObject(st.selected.pageId, st.selected.objId)
        showFeedback('Object deleted')
        return
      }

      // Escape key to deselect or cancel editing
      if (e.key === 'Escape') {
        st.select(null)
        st.setEditing(null)
        st.setTool('select')
        return
      }

      // Tool switching shortcuts (when not typing)
      if (!isInput && !t.isContentEditable && !mod) {
        if (key === 'v') st.setTool('select')
        else if (key === 'h') st.setTool('hand')
        else if (key === 't') st.setTool('edit-text')
        else if (key === 'a') st.setTool('add-text')
        else if (key === 'e') st.setTool('eraser')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Autosave: debounced 3 seconds after changes
  const saveStatus = useEditor((s) => s.saveStatus)
  useEffect(() => {
    if (saveStatus !== 'unsaved') return
    const timer = setTimeout(() => {
      void useEditor.getState().saveDocument()
    }, 3000)
    return () => clearTimeout(timer)
  }, [saveStatus])

  // Warn before closing tab with unexported/unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().saveStatus === 'unsaved') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return (
    <div className="flex h-full flex-col bg-bg">
      <Toolbar
        onError={setError}
        onExport={() => setExporting({ pages: useEditor.getState().pages, suffix: '-edited' })}
      />

      {error && (
        <div className="flex items-center justify-between border-b border-danger/20 bg-danger/5 px-4 py-1.5 text-xs text-danger">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError(null)}>
            <X size={13} />
          </button>
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

      {/* Floating feedback toast */}
      {feedback && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check size={13} className="text-accent" />
          <span>{feedback}</span>
        </div>
      )}

      {exporting && (
        <ExportDialog pages={exporting.pages} suffix={exporting.suffix} onClose={() => setExporting(null)} />
      )}
    </div>
  )
}
