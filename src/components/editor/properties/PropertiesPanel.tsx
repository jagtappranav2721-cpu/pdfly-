import { useRef, type ReactNode } from 'react'
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Italic, Lock, RotateCcw, RotateCw, Trash2, Underline, Unlock, Replace,
} from 'lucide-react'
import IconButton from '../../common/IconButton'
import { useEditor } from '../../../stores/editorStore'
import { FONT_FAMILIES, STATUS_LABEL } from '../../../services/fonts/fontMatcher'
import { prepareImage } from '../../../services/pdf/images'
import { round1 } from '../../../utils/geometry'
import type { ImageObj, PageObject, ShapeObj, StdFont, TextObj } from '../../../types'

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-b border-line px-4 py-3.5">
    <h3 className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-muted">{title}</h3>
    <div className="space-y-2">{children}</div>
  </section>
)

function Num({ label, value, onChange, step = 1, min, max }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="w-4 shrink-0">{label}</span>
      <input
        type="number" className="field" step={step} min={min} max={max} value={Number.isFinite(value) ? round1(value) : 0}
        onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) onChange(v) }}
      />
    </label>
  )
}

const Color = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="flex items-center justify-between text-xs text-muted">
    {label}
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-line bg-white p-0.5" />
  </label>
)

export default function PropertiesPanel({ onError }: { onError: (m: string) => void }) {
  const selected = useEditor((s) => s.selected)
  const pages = useEditor((s) => s.pages)
  const currentId = useEditor((s) => s.currentPageId)
  const page = pages.find((p) => p.id === (selected?.pageId ?? currentId)) ?? pages[0]
  const obj: PageObject | undefined = selected ? page?.objects.find((o) => o.id === selected.objId) : undefined

  return (
    <aside className="thin-scroll hidden w-[264px] shrink-0 overflow-y-auto border-l border-line bg-surface md:block">
      {!obj || !page ? (
        <PagePanel />
      ) : obj.type === 'text' ? (
        <TextPanel obj={obj} pageId={page.id} />
      ) : obj.type === 'image' ? (
        <ImagePanel obj={obj} pageId={page.id} onError={onError} />
      ) : obj.type === 'shape' ? (
        <ShapePanel obj={obj} pageId={page.id} />
      ) : (
        <Section title="Drawing">
          <p className="text-xs text-muted">Freehand strokes can be deleted or undone.</p>
          <button className="flex h-8 items-center gap-1.5 text-xs text-danger" onClick={() => useEditor.getState().removeObject(page.id, obj.id)}>
            <Trash2 size={13} /> Delete
          </button>
        </Section>
      )}
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
      <Section title="Text">
        <select className="field" value={obj.style.family} onChange={(e) => setStyle({ family: e.target.value as StdFont }, 'family')}>
          {FONT_FAMILIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="number" className="field" min={1} step={0.5} value={round1(obj.style.size)}
            onChange={(e) => { const v = parseFloat(e.target.value); if (v > 0) setStyle({ size: v }, 'size') }}
          />
          <span className="text-xs text-muted">pt</span>
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton tip="Bold" active={obj.style.bold} onClick={() => setStyle({ bold: !obj.style.bold }, 'bold')}><Bold size={15} /></IconButton>
          <IconButton tip="Italic" active={obj.style.italic} onClick={() => setStyle({ italic: !obj.style.italic }, 'italic')}><Italic size={15} /></IconButton>
          <IconButton tip="Underline" active={obj.style.underline} onClick={() => setStyle({ underline: !obj.style.underline }, 'ul')}><Underline size={15} /></IconButton>
          <span className="mx-1 h-5 w-px bg-line" />
          <IconButton tip="Align left" active={obj.style.align === 'left'} onClick={() => setStyle({ align: 'left' }, 'align')}><AlignLeft size={15} /></IconButton>
          <IconButton tip="Align centre" active={obj.style.align === 'center'} onClick={() => setStyle({ align: 'center' }, 'align')}><AlignCenter size={15} /></IconButton>
          <IconButton tip="Align right" active={obj.style.align === 'right'} onClick={() => setStyle({ align: 'right' }, 'align')}><AlignRight size={15} /></IconButton>
        </div>
        <Color label={o?.colorEstimated ? 'Colour (estimated)' : 'Colour'} value={obj.style.color} onChange={(v) => setStyle({ color: v }, 'color')} />
      </Section>

      {o && (
        <Section title="Original font">
          <div className="text-xs">
            <div className="font-medium break-all">{o.fontName}</div>
            <div className="mt-0.5 text-muted">
              {o.isSubset ? 'Subset font, embedded' : o.embedded === null ? 'Embedding not reported' : o.embedded ? 'Embedded' : 'Not embedded'}
            </div>
          </div>
          <div
            className={`rounded-md px-2.5 py-2 text-xs leading-relaxed ${
              o.match.status === 'original-available' ? 'bg-success/10 text-success' : 'bg-bg text-muted'
            }`}
          >
            <div className="font-medium text-ink">{STATUS_LABEL[o.match.status]}</div>
            {o.match.note}
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            Applied as an <b className="font-medium text-ink">overlay edit</b>: the original text is covered and the new text is drawn on top.
          </p>
        </Section>
      )}

      <Section title="Position">
        <div className="grid grid-cols-2 gap-2">
          <Num label="X" value={obj.x} onChange={(v) => patch({ x: v }, 'x')} />
          <Num label="Y" value={obj.y} onChange={(v) => patch({ y: v }, 'y')} />
        </div>
        {!o && <Num label="∠" value={obj.rotation} onChange={(v) => patch({ rotation: v }, 'rot')} />}
        <Num label="α" value={Math.round(obj.opacity * 100)} min={0} max={100} onChange={(v) => patch({ opacity: Math.min(1, Math.max(0, v / 100)) }, 'op')} />
      </Section>
      <Delete pageId={pageId} id={obj.id} />
    </>
  )
}

function ImagePanel({ obj, pageId, onError }: { obj: ImageObj; pageId: string; onError: (m: string) => void }) {
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
        <Num label="∠" value={obj.rotation} onChange={(v) => patch({ rotation: v }, 'rot')} />
        <Num label="α" value={Math.round(obj.opacity * 100)} min={0} max={100} onChange={(v) => patch({ opacity: Math.min(1, Math.max(0, v / 100)) }, 'op')} />
        <button
          className="flex h-8 items-center gap-2 text-xs text-muted hover:text-ink"
          onClick={() => patch({ lockAspect: !obj.lockAspect }, 'lock')}
        >
          {obj.lockAspect ? <Lock size={13} /> : <Unlock size={13} />} Maintain aspect ratio
        </button>
        <button className="flex h-8 items-center gap-2 text-xs text-muted hover:text-ink" onClick={() => input.current?.click()}>
          <Replace size={13} /> Replace image
        </button>
        <input
          ref={input} type="file" hidden accept="image/png,image/jpeg,image/webp"
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
  return (
    <>
      <Section title={obj.shape === 'highlight' ? 'Highlight' : 'Shape'}>
        <div className="grid grid-cols-2 gap-2">
          <Num label="W" value={obj.w} onChange={(v) => v > 0 && patch({ w: v }, 'w')} />
          <Num label="H" value={obj.h} onChange={(v) => v > 0 && patch({ h: v }, 'h')} />
          <Num label="X" value={obj.x} onChange={(v) => patch({ x: v }, 'x')} />
          <Num label="Y" value={obj.y} onChange={(v) => patch({ y: v }, 'y')} />
        </div>
        <Color label="Fill" value={obj.fill ?? '#ffffff'} onChange={(v) => patch({ fill: v }, 'fill')} />
        {obj.shape !== 'highlight' && (
          <>
            <Color label="Outline" value={obj.stroke ?? '#635bff'} onChange={(v) => patch({ stroke: v }, 'stroke')} />
            <Num label="▭" value={obj.strokeWidth} min={0} step={0.5} onChange={(v) => patch({ strokeWidth: Math.max(0, v) }, 'sw')} />
            <button className="h-7 text-xs text-muted hover:text-ink" onClick={() => patch({ fill: obj.fill ? null : '#ffffff' }, 'fillToggle')}>
              {obj.fill ? 'Remove fill' : 'Add fill'}
            </button>
          </>
        )}
        <Num label="α" value={Math.round(obj.opacity * 100)} min={0} max={100} onChange={(v) => patch({ opacity: Math.min(1, Math.max(0, v / 100)) }, 'op')} />
      </Section>
      <Delete pageId={pageId} id={obj.id} />
    </>
  )
}

const Delete = ({ pageId, id }: { pageId: string; id: string }) => (
  <div className="px-4 py-3">
    <button
      className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-line text-xs text-danger transition-colors hover:bg-danger/5"
      onClick={() => { const st = useEditor.getState(); st.checkpoint(); st.removeObject(pageId, id) }}
    >
      <Trash2 size={13} /> Delete
    </button>
  </div>
)

function PagePanel() {
  const pages = useEditor((s) => s.pages)
  const currentId = useEditor((s) => s.currentPageId)
  const page = pages.find((p) => p.id === currentId) ?? pages[0]
  if (!page) return null
  const rot = page.rotation % 180 !== 0
  const w = rot ? page.box.h : page.box.w
  const h = rot ? page.box.w : page.box.h
  return (
    <>
      <Section title="Page">
        <div className="text-xs text-muted">
          Page {pages.indexOf(page) + 1} of {pages.length}
          <div className="mt-1 text-ink tabular-nums">
            {round1(w)} × {round1(h)} pt <span className="text-muted">({round1((w / 72) * 25.4)} × {round1((h / 72) * 25.4)} mm)</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton tip="Rotate left" onClick={() => useEditor.getState().rotatePage(page.id, -90)}><RotateCcw size={15} /></IconButton>
          <IconButton tip="Rotate right" onClick={() => useEditor.getState().rotatePage(page.id, 90)}><RotateCw size={15} /></IconButton>
          <span className="ml-1 text-xs text-muted">{page.rotation}°</span>
        </div>
      </Section>
      <div className="px-4 py-3 text-xs leading-relaxed text-muted">
        Choose <b className="font-medium text-ink">Edit text</b> in the toolbar, then click a line of text in the document.
      </div>
    </>
  )
}
