import { useEffect, useRef } from 'react'
import type { ImageObj, PageObject, ShapeObj, TextObj } from '../../../types'
import { useEditor } from '../../../stores/editorStore'
import { cssFamily } from '../../../services/fonts/fontMatcher'
import { ensureFontLoaded } from '../../../services/fonts/fontLibrary'
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
  const isLineOrArrow = obj.type === 'shape' && (obj.shape === 'line' || obj.shape === 'arrow')

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
    outline: selected ? (isLineOrArrow ? '1px dashed rgba(37,99,235,0.45)' : '2px solid #2563EB') : undefined,
    outlineOffset: 2,
    touchAction: 'none',
  }

  if (obj.type === 'text') {
    return (
      <TextView
        obj={obj}
        scale={scale}
        style={common}
        editing={editing}
        handlers={{ onPointerDown, onPointerMove, onPointerUp }}
        onDoubleClick={() => {
          select({ pageId, objId: obj.id })
          setEditing(obj.id)
        }}
        onCommit={(text, preserveSelection) => commitText(pageId, obj, text, preserveSelection)}
      />
    )
  }

  const w = obj.w * scale
  const h = obj.h * scale

  return (
    <div style={{ ...common, width: w, height: h }} {...{ onPointerDown, onPointerMove, onPointerUp }}>
      {obj.type === 'image' ? <ImageBody obj={obj} /> : <ShapeBody obj={obj} scale={scale} />}
      {selected && !obj.rotation && (
        <>
          {isLineOrArrow ? (
            <>
              <LineEndpointHandle
                endpoint="start"
                obj={obj as ShapeObj}
                pageId={pageId}
                pageRotation={pageRotation}
                scale={scale}
              />
              <LineEndpointHandle
                endpoint="end"
                obj={obj as ShapeObj}
                pageId={pageId}
                pageRotation={pageRotation}
                scale={scale}
              />
            </>
          ) : (
            (['nw', 'ne', 'sw', 'se'] as Corner[]).map((c) => (
              <Handle key={c} corner={c} obj={obj} pageId={pageId} pageRotation={pageRotation} scale={scale} />
            ))
          )}
        </>
      )}
    </div>
  )
}

function commitText(pageId: string, obj: TextObj, raw: string, preserveSelection = false) {
  const st = useEditor.getState()
  const text = raw.replace(/\u00A0/g, ' ').replace(/\n$/, '')
  const fresh = st.freshId === obj.id
  const textUnchanged = obj.original ? text === obj.original.text : text.trim() === ''
  const styleUnchanged = obj.original
    ? obj.style.family === obj.original.match.family &&
      obj.style.bold === obj.original.match.bold &&
      obj.style.italic === obj.original.match.italic &&
      obj.style.size === obj.original.size
    : true

  // If nothing was actually edited or changed, discard the object and history entry
  // unless the user is specifically actively editing properties in the sidebar.
  if (fresh && textUnchanged && styleUnchanged && !preserveSelection) {
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
  if (preserveSelection) {
    st.select({ pageId, objId: obj.id })
  }
}

function TextView({
  obj,
  scale,
  style,
  editing,
  handlers,
  onDoubleClick,
  onCommit,
}: {
  obj: TextObj
  scale: number
  style: React.CSSProperties
  editing: boolean
  handlers: Pick<React.DOMAttributes<HTMLDivElement>, 'onPointerDown' | 'onPointerMove' | 'onPointerUp'>
  onDoubleClick: () => void
  onCommit: (text: string, preserveSelection?: boolean) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const s = obj.style

  // Ensure selected font is loaded
  useEffect(() => {
    ensureFontLoaded(s.family)
  }, [s.family])

  // Seed the editable content once when editing starts
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerText = obj.text
    if (editing) {
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
  }, [editing, obj.text])

  const decorations = [
    s.underline ? 'underline' : '',
    s.strikethrough ? 'line-through' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.metaKey || e.ctrlKey
    const st = useEditor.getState()

    if (mod && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      st.toggleSelectedStyle('bold')
    } else if (mod && e.key.toLowerCase() === 'i') {
      e.preventDefault()
      st.toggleSelectedStyle('italic')
    } else if (mod && e.key.toLowerCase() === 'u') {
      e.preventDefault()
      st.toggleSelectedStyle('underline')
    } else if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault()
      void st.saveDocument()
    } else if (mod && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      const el = ref.current
      if (el) {
        const range = document.createRange()
        range.selectNodeContents(el)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    } else if (e.key === 'Escape') {
      ;(e.target as HTMLElement).blur()
    }
    e.stopPropagation()
  }

  return (
    <div
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      spellCheck={false}
      onDoubleClick={onDoubleClick}
      onBlur={(e) => {
        if (!editing) return
        const related = e.relatedTarget as HTMLElement | null
        const inSidebar = related ? !!(related.closest('aside') || related.closest('[data-panel]')) : false
        onCommit(ref.current?.innerText ?? obj.text, inSidebar)
      }}
      onKeyDown={onKeyDown}
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
        textDecoration: decorations || 'none',
        color: s.color,
        backgroundColor: s.backgroundColor || 'transparent',
        textAlign: s.align,
        lineHeight: LINE_HEIGHT,
        whiteSpace: 'pre',
        opacity: obj.opacity,
        minWidth: editing ? '1ch' : undefined,
        minHeight: s.size * scale * LINE_HEIGHT,
        outline: editing ? '1px dashed #2563EB' : style.outline,
        userSelect: editing ? 'text' : 'none',
      }}
    />
  )
}

function ImageBody({ obj }: { obj: ImageObj }) {
  return (
    <img
      src={obj.url}
      alt=""
      draggable={false}
      style={{ width: '100%', height: '100%', opacity: obj.opacity, display: 'block', userSelect: 'none' }}
    />
  )
}

function ShapeBody({ obj, scale }: { obj: ShapeObj; scale: number }) {
  const isHL = obj.shape === 'highlight'

  if (obj.shape === 'line') {
    const x1 = (obj.x1 !== undefined ? obj.x1 : 0) * scale
    const y1 = (obj.y1 !== undefined ? obj.y1 : 0) * scale
    const x2 = (obj.x2 !== undefined ? obj.x2 : obj.w) * scale
    const y2 = (obj.y2 !== undefined ? obj.y2 : obj.h) * scale
    return (
      <svg className="w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={obj.stroke ?? '#2563EB'}
          strokeWidth={(obj.strokeWidth || 2) * scale}
          strokeLinecap="round"
          opacity={obj.opacity}
        />
      </svg>
    )
  }

  if (obj.shape === 'underline' || obj.shape === 'strikethrough') {
    return (
      <svg className="w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          stroke={obj.shape === 'strikethrough' ? (obj.stroke ?? '#DC2626') : (obj.stroke ?? '#2563EB')}
          strokeWidth={(obj.strokeWidth || 2) * scale}
          strokeLinecap="round"
          opacity={obj.opacity}
        />
      </svg>
    )
  }

  if (obj.shape === 'arrow') {
    const x1 = (obj.x1 !== undefined ? obj.x1 : 0) * scale
    const y1 = (obj.y1 !== undefined ? obj.y1 : 0) * scale
    const x2 = (obj.x2 !== undefined ? obj.x2 : obj.w) * scale
    const y2 = (obj.y2 !== undefined ? obj.y2 : obj.h) * scale
    return (
      <svg className="w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
        <defs>
          <marker
            id={`arr-${obj.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={obj.stroke ?? '#2563EB'} />
          </marker>
        </defs>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={obj.stroke ?? '#2563EB'}
          strokeWidth={(obj.strokeWidth || 2) * scale}
          strokeLinecap="round"
          markerEnd={`url(#arr-${obj.id})`}
          opacity={obj.opacity}
        />
      </svg>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: obj.fill ?? 'transparent',
        border: obj.stroke ? `${Math.max(1, (obj.strokeWidth || 2) * scale)}px solid ${obj.stroke}` : undefined,
        borderRadius: obj.shape === 'ellipse' ? '50%' : undefined,
        opacity: obj.opacity,
        mixBlendMode: isHL ? 'multiply' : undefined,
      }}
    />
  )
}

function LineEndpointHandle({
  endpoint,
  obj,
  pageId,
  pageRotation,
  scale,
}: {
  endpoint: 'start' | 'end'
  obj: ShapeObj
  pageId: string
  pageRotation: number
  scale: number
}) {
  const startDrag = useRef<{
    cx: number
    cy: number
    p1: { x: number; y: number }
    p2: { x: number; y: number }
  } | null>(null)

  const isStart = endpoint === 'start'
  const lx = isStart ? (obj.x1 ?? 0) : (obj.x2 ?? obj.w)
  const ly = isStart ? (obj.y1 ?? 0) : (obj.y2 ?? obj.h)

  return (
    <div
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        background: '#ffffff',
        border: '2px solid #2563EB',
        borderRadius: '50%',
        left: lx * scale - 5,
        top: ly * scale - 5,
        cursor: 'crosshair',
        touchAction: 'none',
        zIndex: 10,
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        useEditor.getState().checkpoint()
        startDrag.current = {
          cx: e.clientX,
          cy: e.clientY,
          p1: { x: obj.x + (obj.x1 ?? 0), y: obj.y + (obj.y1 ?? 0) },
          p2: { x: obj.x + (obj.x2 ?? obj.w), y: obj.y + (obj.y2 ?? obj.h) },
        }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const s = startDrag.current
        if (!s) return
        const v = unrotate(e.clientX - s.cx, e.clientY - s.cy, pageRotation)
        const dx = v.x / scale
        const dy = v.y / scale

        const p1 = isStart ? { x: s.p1.x + dx, y: s.p1.y + dy } : s.p1
        const p2 = !isStart ? { x: s.p2.x + dx, y: s.p2.y + dy } : s.p2

        const minX = Math.min(p1.x, p2.x)
        const minY = Math.min(p1.y, p2.y)
        const w = Math.max(Math.abs(p2.x - p1.x), 4)
        const h = Math.max(Math.abs(p2.y - p1.y), 4)

        const x1 = p1.x - minX
        const y1 = p1.y - minY
        const x2 = p2.x - minX
        const y2 = p2.y - minY

        useEditor.getState().updateObject(pageId, obj.id, {
          x: minX,
          y: minY,
          w,
          h,
          x1,
          y1,
          x2,
          y2,
        })
      }}
      onPointerUp={(e) => {
        startDrag.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
      }}
    />
  )
}

function Handle({
  corner,
  obj,
  pageId,
  pageRotation,
  scale,
}: {
  corner: Corner
  obj: ImageObj | ShapeObj
  pageId: string
  pageRotation: number
  scale: number
}) {
  const start = useRef<{ cx: number; cy: number; x: number; y: number; w: number; h: number } | null>(null)
  const west = corner.includes('w')
  const north = corner.includes('n')
  const pos: React.CSSProperties = {
    position: 'absolute',
    width: 9,
    height: 9,
    background: '#fff',
    border: '1.5px solid #2563EB',
    borderRadius: 2,
    left: west ? -5 : undefined,
    right: west ? undefined : -5,
    top: north ? -5 : undefined,
    bottom: north ? undefined : -5,
    cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
    touchAction: 'none',
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
          w,
          h,
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
