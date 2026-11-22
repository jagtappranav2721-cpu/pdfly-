import { useRef } from 'react'
import {
  ArrowLeft, Circle, Download, Highlighter, ImagePlus, MousePointer2, Pencil, Redo2, Square, TextCursorInput, Type, Undo2,
} from 'lucide-react'
import IconButton from '../../common/IconButton'
import { useEditor } from '../../../stores/editorStore'
import { useApp } from '../../../stores/appStore'
import { prepareImage, makeImageObject } from '../../../services/pdf/images'
import type { Tool } from '../../../types'

const TOOLS: { id: Tool; tip: string; icon: typeof Type }[] = [
  { id: 'select', tip: 'Select (V)', icon: MousePointer2 },
  { id: 'edit-text', tip: 'Edit existing text (T)', icon: TextCursorInput },
  { id: 'add-text', tip: 'Add text', icon: Type },
]
const MARKUP: { id: Tool; tip: string; icon: typeof Type }[] = [
  { id: 'highlight', tip: 'Highlight', icon: Highlighter },
  { id: 'rect', tip: 'Rectangle', icon: Square },
  { id: 'ellipse', tip: 'Ellipse', icon: Circle },
  { id: 'draw', tip: 'Draw', icon: Pencil },
]

const Divider = () => <span className="mx-1.5 h-5 w-px bg-line" />

export default function Toolbar({ onExport, onError }: { onExport: () => void; onError: (m: string) => void }) {
  const fileName = useEditor((s) => s.fileName)
  const tool = useEditor((s) => s.tool)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const { undo, redo, setTool } = useEditor.getState()
  const go = useApp((s) => s.go)
  const imgInput = useRef<HTMLInputElement>(null)

  const back = () => {
    const edited = useEditor.getState().past.length > 0
    if (edited && !window.confirm('Leave the editor? Unexported edits will be lost.')) return
    useEditor.getState().reset()
    go('dashboard')
  }

  const addImage = async (file: File) => {
    try {
      const st = useEditor.getState()
      const page = st.pages.find((p) => p.id === st.currentPageId) ?? st.pages[0]
      const img = await prepareImage(file)
      const obj = makeImageObject(img, page.box.w, page.box.h)
      st.checkpoint()
      st.addObject(page.id, obj)
      st.setTool('select')
      st.select({ pageId: page.id, objId: obj.id })
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not add the image.')
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line bg-surface px-3">
      <IconButton tip="Back to dashboard" onClick={back}><ArrowLeft size={16} /></IconButton>
      <span className="mx-1 max-w-[220px] truncate text-[13px] font-medium" title={fileName}>{fileName}</span>
      <Divider />
      <IconButton tip="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}><Undo2 size={16} /></IconButton>
      <IconButton tip="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}><Redo2 size={16} /></IconButton>
      <Divider />
      {TOOLS.map(({ id, tip, icon: Icon }) => (
        <IconButton key={id} tip={tip} active={tool === id} onClick={() => setTool(id)}><Icon size={16} /></IconButton>
      ))}
      <IconButton tip="Add image" onClick={() => imgInput.current?.click()}><ImagePlus size={16} /></IconButton>
      <input
        ref={imgInput} type="file" hidden accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void addImage(f)
          e.target.value = ''
        }}
      />
      <Divider />
      {MARKUP.map(({ id, tip, icon: Icon }) => (
        <IconButton key={id} tip={tip} active={tool === id} onClick={() => setTool(id)}><Icon size={16} /></IconButton>
      ))}
      <button
        onClick={onExport}
        className="ml-auto flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
      >
        <Download size={14} /> Download PDF
      </button>
    </header>
  )
}
