import { useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Circle,
  Download,
  Eraser,
  Eye,
  Hand,
  Highlighter,
  ImagePlus,
  Minus,
  Moon,
  MousePointer2,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Redo2,
  Save,
  Shapes,
  Square,
  Strikethrough,
  Sun,
  TextCursorInput,
  Type,
  Underline,
  Undo2,
  ChevronDown,
} from 'lucide-react'
import IconButton from '../../common/IconButton'
import { useEditor } from '../../../stores/editorStore'
import { useApp } from '../../../stores/appStore'
import { useTheme } from '../../../stores/themeStore'
import { prepareImage, makeImageObject } from '../../../services/pdf/images'
import type { Tool } from '../../../types'

const Divider = () => <span className="mx-1 h-5 w-px bg-line shrink-0" />

export default function Toolbar({
  onExport,
  onError,
}: {
  onExport: () => void
  onError: (m: string) => void
}) {
  const fileName = useEditor((s) => s.fileName)
  const tool = useEditor((s) => s.tool)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const saveStatus = useEditor((s) => s.saveStatus)
  const rightSidebarOpen = useEditor((s) => s.rightSidebarOpen)
  const { undo, redo, setTool, saveDocument, toggleRightSidebar } = useEditor.getState()

  const { theme, toggleTheme, eyeComfort, toggleEyeComfort } = useTheme()
  const go = useApp((s) => s.go)
  const imgInput = useRef<HTMLInputElement>(null)
  const [shapesMenu, setShapesMenu] = useState(false)

  const back = () => {
    const edited = useEditor.getState().saveStatus === 'unsaved'
    if (edited && !window.confirm('Leave the editor? Unsaved edits may be lost.')) return
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

  const handleSave = async () => {
    const success = await saveDocument()
    if (!success) {
      onError('Failed to save document locally.')
    }
  }

  const isShapeActive = tool === 'rect' || tool === 'ellipse' || tool === 'line' || tool === 'arrow'

  return (
    <header className="flex h-13 shrink-0 items-center justify-between border-b border-line bg-toolbar px-3 text-ink transition-colors">
      {/* Left: Back & Document Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <IconButton tip="Back to dashboard" onClick={back}>
          <ArrowLeft size={16} />
        </IconButton>
        <span
          className="mx-1 max-w-[180px] truncate text-xs font-semibold text-ink sm:max-w-[240px]"
          title={fileName}
        >
          {fileName}
        </span>
        <Divider />
        <IconButton tip="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
          <Undo2 size={16} />
        </IconButton>
        <IconButton tip="Redo (Ctrl+Y)" disabled={!canRedo} onClick={redo}>
          <Redo2 size={16} />
        </IconButton>
      </div>

      {/* Center: Tools & Markup */}
      <div className="flex items-center gap-0.5 overflow-x-auto px-2 thin-scroll">
        <IconButton tip="Select (V)" active={tool === 'select'} onClick={() => setTool('select')}>
          <MousePointer2 size={16} />
        </IconButton>
        <IconButton tip="Hand / Pan (H)" active={tool === 'hand'} onClick={() => setTool('hand')}>
          <Hand size={16} />
        </IconButton>
        <IconButton
          tip="Edit existing text (T)"
          active={tool === 'edit-text'}
          onClick={() => setTool('edit-text')}
        >
          <TextCursorInput size={16} />
        </IconButton>
        <IconButton tip="Add new text" active={tool === 'add-text'} onClick={() => setTool('add-text')}>
          <Type size={16} />
        </IconButton>

        <Divider />

        <IconButton
          tip="Highlight text/area"
          active={tool === 'highlight'}
          onClick={() => setTool('highlight')}
        >
          <Highlighter size={16} />
        </IconButton>
        <IconButton
          tip="Underline annotation"
          active={tool === 'underline'}
          onClick={() => setTool('underline')}
        >
          <Underline size={16} />
        </IconButton>
        <IconButton
          tip="Strikethrough annotation"
          active={tool === 'strikethrough'}
          onClick={() => setTool('strikethrough')}
        >
          <Strikethrough size={16} />
        </IconButton>
        <IconButton tip="Freehand draw" active={tool === 'draw'} onClick={() => setTool('draw')}>
          <Pencil size={16} />
        </IconButton>

        {/* Shapes Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShapesMenu(!shapesMenu)}
            data-tip="Shapes"
            className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs transition-colors ${
              isShapeActive
                ? 'bg-accent-soft text-accent font-medium'
                : 'text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/5'
            }`}
          >
            <Shapes size={16} />
            <ChevronDown size={12} />
          </button>

          {shapesMenu && (
            <div className="absolute left-0 top-full z-50 mt-1 flex flex-col rounded-xl border border-line bg-surface p-1 shadow-lg">
              <button
                onClick={() => {
                  setTool('rect')
                  setShapesMenu(false)
                }}
                className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs text-left transition-colors ${
                  tool === 'rect' ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-toolbar'
                }`}
              >
                <Square size={14} /> Rectangle
              </button>
              <button
                onClick={() => {
                  setTool('ellipse')
                  setShapesMenu(false)
                }}
                className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs text-left transition-colors ${
                  tool === 'ellipse' ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-toolbar'
                }`}
              >
                <Circle size={14} /> Ellipse / Circle
              </button>
              <button
                onClick={() => {
                  setTool('line')
                  setShapesMenu(false)
                }}
                className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs text-left transition-colors ${
                  tool === 'line' ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-toolbar'
                }`}
              >
                <Minus size={14} /> Straight Line
              </button>
              <button
                onClick={() => {
                  setTool('arrow')
                  setShapesMenu(false)
                }}
                className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs text-left transition-colors ${
                  tool === 'arrow' ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-toolbar'
                }`}
              >
                <ArrowUpRight size={14} /> Directional Arrow
              </button>
            </div>
          )}
        </div>

        <IconButton tip="Add image" onClick={() => imgInput.current?.click()}>
          <ImagePlus size={16} />
        </IconButton>
        <input
          ref={imgInput}
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void addImage(f)
            e.target.value = ''
          }}
        />

        <IconButton tip="Eraser" active={tool === 'eraser'} onClick={() => setTool('eraser')}>
          <Eraser size={16} />
        </IconButton>
      </div>

      {/* Right: Actions, Theme & Export */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Save Changes Button */}
        <button
          onClick={() => void handleSave()}
          data-tip="Save changes (Ctrl+S)"
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all ${
            saveStatus === 'unsaved'
              ? 'border-accent bg-accent-soft text-accent hover:bg-accent hover:text-white'
              : 'border-line bg-surface text-muted hover:text-ink'
          }`}
        >
          {saveStatus === 'saved' ? (
            <>
              <Check size={14} className="text-success" />
              <span className="hidden sm:inline">Saved</span>
            </>
          ) : saveStatus === 'saving' ? (
            <>
              <Save size={14} className="animate-pulse text-accent" />
              <span className="hidden sm:inline">Saving…</span>
            </>
          ) : (
            <>
              <Save size={14} className="text-accent" />
              <span className="font-semibold text-accent">Save</span>
            </>
          )}
        </button>

        <Divider />

        {/* Eye Comfort Mode Toggle */}
        <IconButton
          tip={eyeComfort ? 'Disable eye comfort mode' : 'Enable eye comfort mode (warm document tint)'}
          active={eyeComfort}
          onClick={toggleEyeComfort}
        >
          <Eye size={16} />
        </IconButton>

        {/* Theme Toggle (Light / Dark) */}
        <IconButton
          tip={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
        </IconButton>

        {/* Toggle Right Properties Panel */}
        <IconButton
          tip={rightSidebarOpen ? 'Hide properties panel' : 'Show properties panel'}
          onClick={toggleRightSidebar}
          active={rightSidebarOpen}
        >
          {rightSidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </IconButton>

        {/* Primary Export Button */}
        <button
          onClick={onExport}
          className="ml-1 flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-accent-hover"
        >
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>
    </header>
  )
}
