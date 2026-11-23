import { useRef, type ReactNode } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Lock,
  RotateCcw,
  RotateCw,
  Sparkles,
  Strikethrough,
  Trash2,
  Underline,
  Unlock,
  Replace,
  X,
} from 'lucide-react'
import IconButton from '../../common/IconButton'
import { useEditor } from '../../../stores/editorStore'
import { STATUS_LABEL } from '../../../services/fonts/fontMatcher'
import { prepareImage } from '../../../services/pdf/images'
import { round1 } from '../../../utils/geometry'
import FontSelector from './FontSelector'
import PageInfoSection from './PageInfoSection'
import type { ImageObj, PageObject, ShapeObj, TextObj } from '../../../types'

const COLOR_PRESETS = ['#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#0F172A', '#FFFFFF']
const HL_PRESETS = ['#FFE14D', '#86EFAC', '#F9A8D4', '#93C5FD', '#FDBA74']

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-b border-line px-4 py-3.5">
    <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
    <div className="space-y-2">{children}</div>
  </section>
)

function Num({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="w-16 shrink-0 font-medium truncate">{label}</span>
      <input
        type="number"
        className="field"
        step={step}
        min={min}
        max={max}
        value={Number.isFinite(value) ? round1(value) : 0}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (Number.isFinite(v)) onChange(v)
        }}
      />
    </label>
  )
}

const Color = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) => (
  <label className="flex items-center justify-between text-xs text-muted">
    <span className="font-medium text-ink">{label}</span>
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-8 cursor-pointer rounded-md border border-line bg-surface p-0.5 shadow-2xs"
      />
      <span className="text-[11px] font-mono uppercase text-muted">{value}</span>
    </div>
  </label>
)

export default function PropertiesPanel({ onError }: { onError: (m: string) => void }) {
  const selected = useEditor((s) => s.selected)
  const pages = useEditor((s) => s.pages)
  const currentId = useEditor((s) => s.currentPageId)
  const rightSidebarOpen = useEditor((s) => s.rightSidebarOpen)
  const toggleRightSidebar = useEditor((s) => s.toggleRightSidebar)

  const page = pages.find((p) => p.id === (selected?.pageId ?? currentId)) ?? pages[0]
  const obj: PageObject | undefined = selected ? page?.objects.find((o) => o.id === selected.objId) : undefined

  if (!rightSidebarOpen) return null

  return (
    <aside
      onMouseDown={(e) => {
        e.stopPropagation()
        const target = e.target as HTMLElement
        if (!target.closest('input') && !target.closest('textarea')) {
          e.preventDefault()
        }
      }}
      className="thin-scroll absolute md:relative right-0 z-20 h-full flex w-[280px] shrink-0 flex-col overflow-y-auto border-l border-line bg-surface shadow-lg md:shadow-none transition-all"
    >
      {/* Panel Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {obj ? `${obj.type} Properties` : 'Document & Page Info'}
        </span>
        <button
          onClick={toggleRightSidebar}
          aria-label="Hide panel"
          className="rounded p-1 text-muted hover:bg-toolbar hover:text-ink md:hidden"
        >
          <X size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {!obj || !page ? (
          <div className="p-4">
            <PageInfoSection />
          </div>
        ) : obj.type === 'text' ? (
          <TextPanel obj={obj} pageId={page.id} />
        ) : obj.type === 'image' ? (
          <ImagePanel obj={obj} pageId={page.id} onError={onError} />
        ) : obj.type === 'shape' ? (
          <ShapePanel obj={obj} pageId={page.id} />
        ) : (
          <Section title="Drawing">
            <p className="text-xs text-muted leading-relaxed">Freehand ink stroke. Can be recolored or deleted.</p>
            <Color label="Stroke Color" value={obj.color} onChange={(v) => useEditor.getState().updateObject(page.id, obj.id, { color: v })} />
            <Num label="Width" value={obj.width} min={1} max={20} onChange={(v) => useEditor.getState().updateObject(page.id, obj.id, { width: v })} />
            <Delete pageId={page.id} id={obj.id} />
          </Section>
        )}
      </div>
    </aside>
  )
}

function usePatch(pageId: string, id: string) {
  return (patch: Partial<PageObject>, key: string) => {
    const st = useEditor.getState()
    st.checkpoint(key + id)
    st.updateObject(pageId, id, patch)
  }
}

function TextPanel({ obj, pageId }: { obj: TextObj; pageId: string }) {
  const patch = usePatch(pageId, obj.id)
  const setStyle = (s: Partial<TextObj['style']>, key: string) => patch({ style: { ...obj.style, ...s } }, key)
  const o = obj.original

  return (
    <>
      <Section title="Typography">
        {/* 50+ Fonts Searchable Selector */}
        <FontSelector
          value={obj.style.family}
          onChange={(family) => setStyle({ family }, 'family')}
        />

        <div className="flex items-center gap-2">
          <input
            type="number"
            className="field font-medium"
            min={1}
            step={0.5}
            value={round1(obj.style.size)}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (v > 0) setStyle({ size: v }, 'size')
            }}
          />
          <span className="text-xs text-muted">pt</span>
        </div>

        {/* Style toggles */}
        <div className="flex items-center gap-1 border-y border-line py-2">
          <IconButton
            tip="Bold (Ctrl+B)"
            active={obj.style.bold}
            onClick={() => setStyle({ bold: !obj.style.bold }, 'bold')}
          >
            <Bold size={15} />
          </IconButton>
          <IconButton
            tip="Italic (Ctrl+I)"
            active={obj.style.italic}
            onClick={() => setStyle({ italic: !obj.style.italic }, 'italic')}
          >
            <Italic size={15} />
          </IconButton>
          <IconButton
            tip="Underline (Ctrl+U)"
            active={obj.style.underline}
            onClick={() => setStyle({ underline: !obj.style.underline }, 'underline')}
          >
            <Underline size={15} />
          </IconButton>
          <IconButton
            tip="Strikethrough"
            active={obj.style.strikethrough}
            onClick={() => setStyle({ strikethrough: !obj.style.strikethrough }, 'strike')}
          >
            <Strikethrough size={15} />
          </IconButton>

          <div className="mx-1 h-4 w-px bg-line" />

          <IconButton
            tip="Align left"
            active={obj.style.align === 'left'}
            onClick={() => setStyle({ align: 'left' }, 'align')}
          >
            <AlignLeft size={15} />
          </IconButton>
          <IconButton
            tip="Align center"
            active={obj.style.align === 'center'}
            onClick={() => setStyle({ align: 'center' }, 'align')}
          >
            <AlignCenter size={15} />
          </IconButton>
          <IconButton
            tip="Align right"
            active={obj.style.align === 'right'}
            onClick={() => setStyle({ align: 'right' }, 'align')}
          >
            <AlignRight size={15} />
          </IconButton>
        </div>

        <Color
          label={o?.colorEstimated ? 'Color (estimated)' : 'Text Color'}
          value={obj.style.color}
          onChange={(v) => setStyle({ color: v }, 'color')}
        />

        <Color
          label="Highlight Color"
          value={obj.style.backgroundColor || '#ffffff'}
          onChange={(v) => setStyle({ backgroundColor: v }, 'bgcolor')}
        />
        {obj.style.backgroundColor && (
          <button
            onClick={() => setStyle({ backgroundColor: null }, 'bgcolor')}
            className="text-[11px] text-muted hover:text-ink cursor-pointer"
          >
            Clear highlight
          </button>
        )}
      </Section>

      {/* Font Detection & Recommendation Card */}
      {o && (
        <Section title="Detected Font & Recommendation">
          <div className="rounded-xl border border-line bg-toolbar p-3 text-xs leading-relaxed">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink break-all">{o.fontName}</span>
              <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                {o.isSubset ? 'Subset' : o.embedded ? 'Embedded' : 'Standard'}
              </span>
            </div>

            <div className="mt-2 text-muted">
              {STATUS_LABEL[o.match.status] || 'Font analyzed'}
            </div>

            {o.match.recommendedFont && o.match.recommendedFont !== obj.style.family && (
              <button
                type="button"
                onClick={() => setStyle({ family: o.match.recommendedFont! }, 'family')}
                className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-accent-hover transition-colors cursor-pointer"
              >
                <Sparkles size={13} /> Apply Recommended: {o.match.recommendedFont}
              </button>
            )}
          </div>
        </Section>
      )}

      <Section title="Position & Layout">
        <div className="grid grid-cols-2 gap-2">
          <Num label="X" value={obj.x} onChange={(v) => patch({ x: v }, 'x')} />
          <Num label="Y" value={obj.y} onChange={(v) => patch({ y: v }, 'y')} />
        </div>
        <Num label="Rotation" value={obj.rotation} onChange={(v) => patch({ rotation: v }, 'rot')} />
        <Num
          label="Opacity"
          value={Math.round(obj.opacity * 100)}
          min={0}
          max={100}
          onChange={(v) => patch({ opacity: Math.min(1, Math.max(0, v / 100)) }, 'op')}
        />
      </Section>
      <Delete pageId={pageId} id={obj.id} />
    </>
  )
}

function ImagePanel({
  obj,
  pageId,
  onError,
}: {
  obj: ImageObj
  pageId: string
  onError: (m: string) => void
}) {
  const patch = usePatch(pageId, obj.id)
  const input = useRef<HTMLInputElement>(null)
  const ratio = obj.w / obj.h
  const setW = (w: number) => w > 0 && patch(obj.lockAspect ? { w, h: w / ratio } : { w }, 'w')
  const setH = (h: number) => h > 0 && patch(obj.lockAspect ? { h, w: h * ratio } : { h }, 'h')

  return (
    <>
      <Section title="Image">
        <div className="grid grid-cols-2 gap-2">
          <Num label="W" value={obj.w} onChange={setW} />
          <Num label="H" value={obj.h} onChange={setH} />
          <Num label="X" value={obj.x} onChange={(v) => patch({ x: v }, 'x')} />
          <Num label="Y" value={obj.y} onChange={(v) => patch({ y: v }, 'y')} />
        </div>
        <Num label="Rotation" value={obj.rotation} onChange={(v) => patch({ rotation: v }, 'rot')} />
        <Num
          label="Opacity"
          value={Math.round(obj.opacity * 100)}
          min={0}
          max={100}
          onChange={(v) => patch({ opacity: Math.min(1, Math.max(0, v / 100)) }, 'op')}
        />
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-md border border-line bg-toolbar px-2 text-xs font-medium text-ink hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => patch({ lockAspect: !obj.lockAspect }, 'lock')}
        >
          {obj.lockAspect ? <Lock size={13} className="text-accent" /> : <Unlock size={13} />}
          Maintain aspect ratio
        </button>
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-md border border-line bg-toolbar px-2 text-xs font-medium text-ink hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => input.current?.click()}
        >
          <Replace size={13} /> Replace image
        </button>
        <input
          ref={input}
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              const img = await prepareImage(f)
              patch({ data: img.data, mime: img.mime, url: img.url, h: obj.w * (img.height / img.width) }, 'replace')
            } catch (err) {
              onError(err instanceof Error ? err.message : 'Could not replace the image.')
            }
          }}
        />
      </Section>
      <Delete pageId={pageId} id={obj.id} />
    </>
  )
}

function ShapePanel({ obj, pageId }: { obj: ShapeObj; pageId: string }) {
  const patch = usePatch(pageId, obj.id)
  const isLineLike = obj.shape === 'line' || obj.shape === 'arrow' || obj.shape === 'underline' || obj.shape === 'strikethrough'
  const isHL = obj.shape === 'highlight'

  return (
    <>
      <Section title={isHL ? 'Highlight Area' : isLineLike ? (obj.shape === 'arrow' ? 'Arrow Properties' : 'Line Properties') : 'Shape Properties'}>
        <div className="grid grid-cols-2 gap-2">
          <Num label="W" value={obj.w} onChange={(v) => v > 0 && patch({ w: v }, 'w')} />
          <Num label="H" value={obj.h} onChange={(v) => v > 0 && patch({ h: v }, 'h')} />
          <Num label="X" value={obj.x} onChange={(v) => patch({ x: v }, 'x')} />
          <Num label="Y" value={obj.y} onChange={(v) => patch({ y: v }, 'y')} />
        </div>

        {isHL ? (
          <div className="space-y-2">
            <Color label="Highlight Color" value={obj.fill ?? '#ffe14d'} onChange={(v) => patch({ fill: v }, 'fill')} />
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Presets:</span>
              {HL_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  onClick={() => patch({ fill: c }, 'fill')}
                  className={`h-5 w-5 rounded-full border border-black/10 transition-transform hover:scale-110 cursor-pointer ${
                    obj.fill === c ? 'ring-2 ring-accent ring-offset-1' : ''
                  }`}
                />
              ))}
            </div>
          </div>
        ) : isLineLike ? (
          <div className="space-y-3">
            <Color label="Stroke Color" value={obj.stroke ?? '#2563EB'} onChange={(v) => patch({ stroke: v }, 'stroke')} />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Presets:</span>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  onClick={() => patch({ stroke: c }, 'stroke')}
                  className={`h-5 w-5 rounded-full border border-black/15 transition-transform hover:scale-110 cursor-pointer ${
                    obj.stroke === c ? 'ring-2 ring-accent ring-offset-1' : ''
                  }`}
                />
              ))}
            </div>
            <Num
              label="Thickness"
              value={obj.strokeWidth || 2}
              min={1}
              max={24}
              step={0.5}
              onChange={(v) => patch({ strokeWidth: Math.max(1, v) }, 'sw')}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <Color label="Border Color" value={obj.stroke ?? '#2563EB'} onChange={(v) => patch({ stroke: v }, 'stroke')} />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Border:</span>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  onClick={() => patch({ stroke: c }, 'stroke')}
                  className={`h-5 w-5 rounded-full border border-black/15 transition-transform hover:scale-110 cursor-pointer ${
                    obj.stroke === c ? 'ring-2 ring-accent ring-offset-1' : ''
                  }`}
                />
              ))}
            </div>
            <Num
              label="Border W"
              value={obj.strokeWidth || 2}
              min={0}
              max={24}
              step={0.5}
              onChange={(v) => patch({ strokeWidth: Math.max(0, v) }, 'sw')}
            />
            <Color label="Fill Color" value={obj.fill ?? '#ffffff'} onChange={(v) => patch({ fill: v }, 'fill')} />
            <button
              type="button"
              className="h-7 w-full rounded border border-line bg-toolbar px-2 text-xs text-ink hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => patch({ fill: obj.fill ? null : '#ffffff' }, 'fillToggle')}
            >
              {obj.fill ? 'Make Fill Transparent' : 'Add White Fill'}
            </button>
          </div>
        )}

        <Num
          label="Opacity"
          value={Math.round(obj.opacity * 100)}
          min={0}
          max={100}
          onChange={(v) => patch({ opacity: Math.min(1, Math.max(0, v / 100)) }, 'op')}
        />
      </Section>
      <Delete pageId={pageId} id={obj.id} />
    </>
  )
}

const Delete = ({ pageId, id }: { pageId: string; id: string }) => (
  <div className="px-4 py-3">
    <button
      type="button"
      className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-danger/30 text-xs font-medium text-danger transition-colors hover:bg-danger/10 cursor-pointer"
      onClick={() => {
        const st = useEditor.getState()
        st.checkpoint()
        st.removeObject(pageId, id)
      }}
    >
      <Trash2 size={13} /> Delete Selected Object
    </button>
  </div>
)
