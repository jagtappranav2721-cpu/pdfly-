import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DetectedText, PageModel, PageObject, PathObj, ShapeObj, TextObj } from '../../../types'
import { useEditor } from '../../../stores/editorStore'
import { useVisible } from '../../../hooks/useVisible'
import { usePageRender } from '../../../hooks/usePageRender'
import { registerCanvas, getCanvas } from '../../../services/pdf/canvasRegistry'
import { detectText, boxTopForBaseline } from '../../../services/pdf/textDetection'
import { sampleColors } from '../../../services/pdf/pixelSampling'
import { uid } from '../../../utils/id'
import { unrotate } from '../../../utils/geometry'
import { prepareImage, makeImageObject } from '../../../services/pdf/images'
import ObjectView from './ObjectView'

type Draft =
  | { kind: 'box'; shape: 'rect' | 'ellipse' | 'highlight'; x0: number; y0: number; x: number; y: number }
  | { kind: 'line'; shape: 'line' | 'arrow' | 'underline' | 'strikethrough'; x0: number; y0: number; x: number; y: number }
  | { kind: 'path'; points: { x: number; y: number }[] }

function PageView({ page }: { page: PageModel }) {
  const scale = useEditor((s) => s.scale)
  const source = useEditor((s) => (page.sourceId ? s.sources[page.sourceId] : undefined))
  const tool = useEditor((s) => s.tool)
  const selectedId = useEditor((s) => (s.selected?.pageId === page.id ? s.selected.objId : null))
  const { ref, visible } = useVisible<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [detected, setDetected] = useState<DetectedText[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)

  usePageRender(canvasRef, page, source, scale, visible)

  useEffect(() => {
    registerCanvas(page.id, canvasRef.current)
    return () => registerCanvas(page.id, null)
  }, [page.id])

  // Text detection is only needed for the "Edit text" tool.
  useEffect(() => {
    if (tool !== 'edit-text' || !visible || !source) return
    let live = true
    detectText(source.id, source.doc, page.srcIndex)
      .then((d) => live && setDetected(d))
      .catch(() => live && setDetected([]))
    return () => {
      live = false
    }
  }, [tool, visible, source, page.srcIndex])

  const rotated = page.rotation % 180 !== 0
  const outerW = (rotated ? page.box.h : page.box.w) * scale
  const outerH = (rotated ? page.box.w : page.box.h) * scale
  const w = page.box.w * scale
  const h = page.box.h * scale

  const toPage = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const r = inner.current!.getBoundingClientRect()
      const v = unrotate(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), page.rotation)
      return { x: v.x / scale + page.box.w / 2, y: v.y / scale + page.box.h / 2 }
    },
    [page.rotation, page.box.w, page.box.h, scale],
  )

  const editedKeys = useMemo(
    () => new Set(page.objects.filter((o): o is TextObj => o.type === 'text' && !!o.original).map((o) => o.original!.itemKey)),
    [page.objects],
  )

  const startEditExisting = (d: DetectedText) => {
    const st = useEditor.getState()
    const existing = page.objects.find((o) => o.type === 'text' && o.original?.itemKey === d.key)
    if (existing) {
      st.select({ pageId: page.id, objId: existing.id })
      st.setEditing(existing.id)
      return
    }
    const canvas = getCanvas(page.id)
    const sample = canvas
      ? sampleColors(canvas, page.box.w, page.box.h, { x: d.x, y: d.y, w: d.w, h: d.h })
      : { background: '#ffffff', text: '#0F172A', textEstimated: true }

    const obj: TextObj = {
      id: uid(),
      type: 'text',
      x: d.x,
      y: boxTopForBaseline(d.baseline, d.size),
      rotation: 0,
      opacity: 1,
      text: d.text,
      style: {
        family: d.match.family,
        size: d.size,
        bold: d.match.bold,
        italic: d.match.italic,
        underline: false,
        color: sample.text,
        align: 'left',
      },
      cover: { x: d.x - 0.5, y: d.y, w: d.w + 1, h: d.h, color: sample.background },
      original: {
        itemKey: d.key,
        text: d.text,
        fontName: d.fontName,
        isSubset: d.isSubset,
        embedded: d.embedded,
        match: d.match,
        colorEstimated: sample.textEstimated,
      },
    }
    st.checkpoint()
    st.addObject(page.id, obj)
    st.select({ pageId: page.id, objId: obj.id })
    st.setEditing(obj.id, true)
  }

  const onOverlayDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget || e.button !== 0) return
    const st = useEditor.getState()
    st.setCurrentPage(page.id)
    const p = toPage(e)

    if (tool === 'select' || tool === 'edit-text' || tool === 'hand') {
      st.select(null)
      return
    }

    if (tool === 'eraser') {
      // Find top-most object near clicked point and delete it
      const hit = [...page.objects].reverse().find((o) => {
        if (o.type === 'shape' || o.type === 'image') {
          return p.x >= o.x && p.x <= o.x + o.w && p.y >= o.y && p.y <= o.y + o.h
        }
        if (o.type === 'text') {
          return p.x >= o.x && p.x <= o.x + 120 && p.y >= o.y && p.y <= o.y + (o.style.size || 14) * 1.5
        }
        return false
      })
      if (hit) {
        st.checkpoint()
        st.removeObject(page.id, hit.id)
      }
      return
    }

    if (tool === 'add-text') {
      const obj: TextObj = {
        id: uid(),
        type: 'text',
        x: p.x,
        y: p.y,
        rotation: 0,
        opacity: 1,
        text: '',
        style: {
          family: 'Montserrat',
          size: 16,
          bold: false,
          italic: false,
          underline: false,
          color: '#0F172A',
          align: 'left',
        },
      }
      st.checkpoint()
      st.addObject(page.id, obj)
      st.select({ pageId: page.id, objId: obj.id })
      st.setEditing(obj.id, true)
      return
    }

    e.currentTarget.setPointerCapture(e.pointerId)

    if (tool === 'draw') {
      setDraft({ kind: 'path', points: [p] })
    } else if (tool === 'line' || tool === 'arrow' || tool === 'underline' || tool === 'strikethrough') {
      setDraft({ kind: 'line', shape: tool, x0: p.x, y0: p.y, x: p.x, y: p.y })
    } else {
      setDraft({
        kind: 'box',
        shape: tool === 'highlight' ? 'highlight' : tool === 'ellipse' ? 'ellipse' : 'rect',
        x0: p.x,
        y0: p.y,
        x: p.x,
        y: p.y,
      })
    }
  }

  const onOverlayMove = (e: React.PointerEvent) => {
    if (!draft) return
    const p = toPage(e)
    setDraft(
      draft.kind === 'path'
        ? { kind: 'path', points: [...draft.points, p] }
        : { ...draft, x: p.x, y: p.y },
    )
  }

  const onOverlayUp = (e: React.PointerEvent) => {
    if (!draft) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const st = useEditor.getState()
    let obj: PageObject | null = null

    if (draft.kind === 'path') {
      if (draft.points.length > 2) {
        obj = {
          id: uid(),
          type: 'path',
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          points: draft.points,
          color: '#0F172A',
          width: 2,
        } as PathObj
      }
    } else if (draft.kind === 'line') {
      const bw = Math.abs(draft.x - draft.x0)
      const bh = Math.abs(draft.y - draft.y0)
      const dist = Math.hypot(draft.x - draft.x0, draft.y - draft.y0)
      if (dist > 3 || bw > 3 || bh > 3) {
        const minX = Math.min(draft.x, draft.x0)
        const minY = Math.min(draft.y, draft.y0)
        const w = Math.max(bw, 4)
        const h = Math.max(bh, 4)
        const isUnderline = draft.shape === 'underline'
        const isStrikethrough = draft.shape === 'strikethrough'

        const x1 = isUnderline || isStrikethrough ? 0 : draft.x0 - minX
        const y1 = isUnderline || isStrikethrough ? h / 2 : draft.y0 - minY
        const x2 = isUnderline || isStrikethrough ? w : draft.x - minX
        const y2 = isUnderline || isStrikethrough ? h / 2 : draft.y - minY

        obj = {
          id: uid(),
          type: 'shape',
          shape: draft.shape,
          x: minX,
          y: minY,
          w,
          h,
          x1,
          y1,
          x2,
          y2,
          rotation: 0,
          opacity: 1,
          fill: null,
          stroke: isStrikethrough ? '#DC2626' : '#2563EB',
          strokeWidth: 2,
        }
      }
    } else {
      const bw = Math.abs(draft.x - draft.x0)
      const bh = Math.abs(draft.y - draft.y0)
      if (bw > 3 && bh > 3) {
        const hl = draft.shape === 'highlight'
        obj = {
          id: uid(),
          type: 'shape',
          shape: draft.shape,
          x: Math.min(draft.x, draft.x0),
          y: Math.min(draft.y, draft.y0),
          w: bw,
          h: bh,
          rotation: 0,
          opacity: hl ? 0.45 : 1,
          fill: hl ? '#ffe14d' : null,
          stroke: hl ? null : '#2563EB',
          strokeWidth: 2,
        }
      }
    }

    setDraft(null)
    if (obj) {
      st.checkpoint()
      st.addObject(page.id, obj)
      st.select({ pageId: page.id, objId: obj.id })
      st.setTool('select')
    }
  }

  const cursor =
    tool === 'select'
      ? 'default'
      : tool === 'hand'
      ? 'grab'
      : tool === 'edit-text'
      ? 'default'
      : tool === 'add-text'
      ? 'text'
      : tool === 'eraser'
      ? 'pointer'
      : 'crosshair'

  const texts = page.objects.filter((o): o is TextObj => o.type === 'text')
  const paths = page.objects.filter((o): o is PathObj => o.type === 'path')

  return (
    <div
      ref={ref}
      data-page-id={page.id}
      style={{ width: outerW, height: outerH, position: 'relative' }}
      className="shrink-0"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault()
      }}
      onDrop={async (e) => {
        const file = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'))
        if (!file) return
        e.preventDefault()
        try {
          const img = await prepareImage(file)
          const st = useEditor.getState()
          const obj = makeImageObject(img, page.box.w, page.box.h, toPage(e))
          st.checkpoint()
          st.addObject(page.id, obj)
          st.select({ pageId: page.id, objId: obj.id })
        } catch {
          /* unsupported image */
        }
      }}
    >
      <div
        ref={inner}
        className="document-page absolute bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08),0_12px_32px_-4px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/5"
        style={{
          width: w,
          height: h,
          left: (outerW - w) / 2,
          top: (outerH - h) / 2,
          transform: page.rotation ? `rotate(${page.rotation}deg)` : undefined,
        }}
      >
        <canvas ref={canvasRef} style={{ width: w, height: h, display: 'block', position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        {/* Text cover boxes (for inline replaced text) */}
        {texts.map(
          (t) =>
            t.cover && (
              <div
                key={'cov-' + t.id}
                style={{
                  position: 'absolute',
                  left: t.cover.x * scale,
                  top: t.cover.y * scale,
                  width: t.cover.w * scale,
                  height: t.cover.h * scale,
                  background: t.cover.color,
                  pointerEvents: 'none',
                }}
              />
            ),
        )}

        {/* Interactive editing layer */}
        <div
          className="absolute inset-0 select-none"
          style={{ cursor }}
          onPointerDown={onOverlayDown}
          onPointerMove={onOverlayMove}
          onPointerUp={onOverlayUp}
        >
          {/* SVG layer for freehand drawings */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
            {paths.map((p) => (
              <polyline
                key={p.id}
                points={p.points.map((pt) => `${pt.x * scale},${pt.y * scale}`).join(' ')}
                fill="none"
                stroke={p.color}
                strokeWidth={p.width * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={p.opacity}
                style={{
                  outline: selectedId === p.id ? '2px solid #2563EB' : undefined,
                }}
              />
            ))}
            {draft?.kind === 'path' && draft.points.length > 1 && (
              <polyline
                points={draft.points.map((pt) => `${pt.x * scale},${pt.y * scale}`).join(' ')}
                fill="none"
                stroke="#0F172A"
                strokeWidth={2 * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {/* Render Page Objects */}
          {page.objects.map((o) => (
            <ObjectView key={o.id} obj={o} pageId={page.id} pageRotation={page.rotation} scale={scale} />
          ))}

          {/* Clickable text runs for Edit text tool */}
          {tool === 'edit-text' &&
            detected.map((d) =>
              editedKeys.has(d.key) ? null : (
                <button
                  key={d.key}
                  type="button"
                  title={`${d.fontName} · ${d.size.toFixed(1)}pt · Click to edit`}
                  onClick={() => startEditExisting(d)}
                  className="absolute rounded-[2px] border border-transparent transition-colors hover:border-accent hover:bg-accent/15"
                  style={{ left: d.x * scale, top: d.y * scale, width: d.w * scale, height: d.h * scale, cursor: 'text' }}
                />
              ),
            )}

          {/* Drafting feedback */}
          {draft?.kind === 'box' && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(draft.x, draft.x0) * scale,
                top: Math.min(draft.y, draft.y0) * scale,
                width: Math.abs(draft.x - draft.x0) * scale,
                height: Math.abs(draft.y - draft.y0) * scale,
                border: '1.5px solid #2563EB',
                background: draft.shape === 'highlight' ? 'rgba(255,225,77,0.45)' : 'rgba(37,99,235,0.08)',
                borderRadius: draft.shape === 'ellipse' ? '50%' : 0,
                pointerEvents: 'none',
              }}
            />
          )}

          {draft?.kind === 'line' && (
            <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <marker
                  id="draft-arrow-head"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="5"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={draft.shape === 'strikethrough' ? '#DC2626' : '#2563EB'} />
                </marker>
              </defs>
              <line
                x1={draft.x0 * scale}
                y1={draft.y0 * scale}
                x2={draft.x * scale}
                y2={draft.y * scale}
                stroke={draft.shape === 'strikethrough' ? '#DC2626' : '#2563EB'}
                strokeWidth={2 * scale}
                strokeLinecap="round"
                markerEnd={draft.shape === 'arrow' ? 'url(#draft-arrow-head)' : undefined}
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(PageView)
