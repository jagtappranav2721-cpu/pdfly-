import { useEffect, useRef } from 'react'
import type { ImageObj, PageObject, ShapeObj, TextObj } from '../../../types'
import { useEditor } from '../../../stores/editorStore'
import { cssFamily } from '../../../services/fonts/fontMatcher'
import { LINE_HEIGHT } from '../../../utils/textMetrics'
import { unrotate } from '../../../utils/geometry'

interface Props {
  obj: PageObject
  pageId: string
  pageRotation: number
  scale: number
}

type Corner = 'nw' | 'ne' | 'sw' | 'se'

export default function ObjectView({ obj, pageId, pageRotation, scale }: Props) {
  const tool = useEditor((s) => s.tool)
  const selected = useEditor((s) => s.selected?.objId === obj.id)
  const editing = useEditor((s) => s.editingId === obj.id)
  const { select, checkpoint, updateObject, setEditing } = useEditor.getState()
  const drag = useRef<{ cx: number; cy: number; ox: number; oy: number } | null>(null)

  if (obj.type === 'path') return null // rendered by the page's SVG layer

  const interactive = tool === 'select' || (tool === 'edit-text' && obj.type === 'text')

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive || editing || e.button !== 0) return
    e.stopPropagation()
    select({ pageId, objId: obj.id })
    if (tool === 'edit-text' && obj.type === 'text') {
      setEditing(obj.id)
      return
    }
    checkpoint()
    drag.current = { cx: e.clientX, cy: e.clientY, ox: obj.x, oy: obj.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const v = unrotate(e.clientX - d.cx, e.clientY - d.cy, pageRotation)
    updateObject(pageId, obj.id, { x: d.ox + v.x / scale, y: d.oy + v.y / scale })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return
    drag.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const common: React.CSSProperties = {
    position: 'absolute',
    left: obj.x * scale,
    top: obj.y * scale,
    transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
    cursor: interactive ? (editing ? 'text' : 'move') : 'default',
    pointerEvents: interactive || editing ? 'auto' : 'none',
    outline: selected ? '1px solid #635bff' : undefined,
    outlineOffset: 2,
    touchAction: 'none',
  }

  if (obj.type === 'text') {
    return (
      <TextView
        obj={obj} scale={scale} style={common} editing={editing}
        handlers={{ onPointerDown, onPointerMove, onPointerUp }}
        onDoubleClick={() => { select({ pageId, objId: obj.id }); setEditing(obj.id) }}
        onCommit={(text) => commitText(pageId, obj, text)}
      />
    )
  }

  const w = obj.w * scale
  const h = obj.h * scale
  return (
    <div style={{ ...common, width: w, height: h }} {...{ onPointerDown, onPointerMove, onPointerUp }}>
      {obj.type === 'image' ? <ImageBody obj={obj} /> : <ShapeBody obj={obj} />}
      {selected && !obj.rotation && (
        <>
          {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((c) => (
            <Handle key={c} corner={c} obj={obj} pageId={pageId} pageRotation={pageRotation} scale={scale} />
          ))}
        </>
      )}
    </div>
  )
}

function commitText(pageId: string, obj: TextObj, raw: string) {
  const st = useEditor.getState()
  const text = raw.replace(/ /g, ' ').replace(/\n$/, '')
  const fresh = st.freshId === obj.id
  const unchanged = obj.original ? text === obj.original.text : false
  if (fresh && (unchanged || (!obj.original && text.trim() === ''))) {
    // Nothing was actually edited: discard the object and its history entry.
    st.cancelLast()
    st.select(null)
    st.setEditing(null)
    return
  }
  if (text !== obj.text) {
    if (!fresh) st.checkpoint()
    st.updateObject(pageId, obj.id, { text })
  }
  st.setEditing(null)
}

function TextView({
  obj, scale, style, editing, handlers, onDoubleClick, onCommit,
}: {
  obj: TextObj
  scale: number
  style: React.CSSProperties
  editing: boolean
  handlers: Pick<React.DOMAttributes<HTMLDivElement>, 'onPointerDown' | 'onPointerMove' | 'onPointerUp'>
  onDoubleClick: () => void
  onCommit: (text: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const s = obj.style

  // Seed the editable content once when editing starts; React must not rewrite it while typing.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerText = obj.text
    if (editing) {
      // Focus on the next frame: the mousedown that created this box would otherwise steal focus back.
      const raf = requestAnimationFrame(() => {
        el.focus()
        const range = document.createRange()
        range.selectNodeContents(el)
        range.collapse(false)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      })
      return () => cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, obj.text])

  return (
    <div
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      spellCheck={false}
      onDoubleClick={onDoubleClick}
      onBlur={() => editing && onCommit(ref.current?.innerText ?? obj.text)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        e.stopPropagation()
      }}
      onPaste={(e) => {
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
      }}
      {...handlers}
      style={{
        ...style,
        fontFamily: cssFamily(s.family),
        fontSize: s.size * scale,
        fontWeight: s.bold ? 700 : 400,
        fontStyle: s.italic ? 'italic' : 'normal',
        textDecoration: s.underline ? 'underline' : 'none',
        color: s.color,
        textAlign: s.align,
        lineHeight: LINE_HEIGHT,
        whiteSpace: 'pre',
        opacity: obj.opacity,
        minWidth: editing ? '1ch' : undefined,
        minHeight: s.size * scale * LINE_HEIGHT,
        outline: editing ? '1px dashed #635bff' : style.outline,
        userSelect: editing ? 'text' : 'none',
      }}
    />
  )
}

function ImageBody({ obj }: { obj: ImageObj }) {
  return <img src={obj.url} alt="" draggable={false} style={{ width: '100%', height: '100%', opacity: obj.opacity, display: 'block', userSelect: 'none' }} />
}

function ShapeBody({ obj }: { obj: ShapeObj }) {
  return (
    <div
      style={{
        width: '100%', height: '100%', boxSizing: 'border-box',
        background: obj.fill ?? 'transparent',
        border: obj.stroke ? `${obj.strokeWidth}px solid ${obj.stroke}` : undefined,
        borderRadius: obj.shape === 'ellipse' ? '50%' : undefined,
        opacity: obj.opacity,
        mixBlendMode: obj.shape === 'highlight' ? 'multiply' : undefined,
      }}
    />
  )
}

function Handle({ corner, obj, pageId, pageRotation, scale }: {
  corner: Corner; obj: ImageObj | ShapeObj; pageId: string; pageRotation: number; scale: number
}) {
  const start = useRef<{ cx: number; cy: number; x: number; y: number; w: number; h: number } | null>(null)
  const west = corner.includes('w')
  const north = corner.includes('n')
  const pos: React.CSSProperties = {
    position: 'absolute', width: 9, height: 9, background: '#fff', border: '1.5px solid #635bff', borderRadius: 2,
    left: west ? -5 : undefined, right: west ? undefined : -5, top: north ? -5 : undefined, bottom: north ? undefined : -5,
    cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize', touchAction: 'none',
  }
  return (
    <div
      style={pos}
      onPointerDown={(e) => {
        e.stopPropagation()
        useEditor.getState().checkpoint()
        start.current = { cx: e.clientX, cy: e.clientY, x: obj.x, y: obj.y, w: obj.w, h: obj.h }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const s = start.current
        if (!s) return
        const v = unrotate(e.clientX - s.cx, e.clientY - s.cy, pageRotation)
        const dx = v.x / scale
        const dy = v.y / scale
        let w = Math.max(8, s.w + (west ? -dx : dx))
        let h = Math.max(8, s.h + (north ? -dy : dy))
        const lock = obj.type === 'image' && obj.lockAspect
        if (lock) {
          const ratio = s.w / s.h
          if (Math.abs(w - s.w) / s.w >= Math.abs(h - s.h) / s.h) h = w / ratio
          else w = h * ratio
        }
        useEditor.getState().updateObject(pageId, obj.id, {
          w, h,
          x: west ? s.x + (s.w - w) : s.x,
          y: north ? s.y + (s.h - h) : s.y,
        })
      }}
      onPointerUp={(e) => {
        start.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
      }}
    />
  )
}
