import type { PDFDocumentProxy } from 'pdfjs-dist'

export type StdFont = 'Helvetica' | 'Times' | 'Courier'
export type FontStatus = 'original-available' | 'similar' | 'substituted' | 'unknown'
export type Align = 'left' | 'center' | 'right'

export interface TextStyle {
  family: StdFont
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
  align: Align
}

export interface FontMatch {
  family: StdFont
  bold: boolean
  italic: boolean
  status: FontStatus
  note: string
}

/** Information about the original run an edited text object replaced. */
export interface OriginalText {
  itemKey: string
  text: string
  fontName: string
  isSubset: boolean
  /** true / false when known, null when PDF.js did not expose it. */
  embedded: boolean | null
  match: FontMatch
  colorEstimated: boolean
}

interface BaseObj {
  id: string
  x: number // pt, top-left origin, unrotated page space
  y: number
  rotation: number // degrees, clockwise
  opacity: number // 0..1
}

export interface TextObj extends BaseObj {
  type: 'text'
  text: string
  style: TextStyle
  /** Region of the original page painted over (overlay-based replacement). */
  cover?: { x: number; y: number; w: number; h: number; color: string }
  original?: OriginalText
}

export interface ImageObj extends BaseObj {
  type: 'image'
  w: number
  h: number
  data: Uint8Array
  mime: 'image/png' | 'image/jpeg'
  url: string
  lockAspect: boolean
}

export interface ShapeObj extends BaseObj {
  type: 'shape'
  shape: 'rect' | 'ellipse' | 'highlight'
  w: number
  h: number
  fill: string | null
  stroke: string | null
  strokeWidth: number
}

export interface PathObj extends BaseObj {
  type: 'path'
  points: { x: number; y: number }[]
  color: string
  width: number
}

export type PageObject = TextObj | ImageObj | ShapeObj | PathObj

export interface PageBox {
  x0: number
  y0: number
  w: number
  h: number
}

export interface PageModel {
  id: string
  sourceId: string | null // null = blank page
  srcIndex: number
  box: PageBox
  rotation: number // total clockwise rotation, multiple of 90
  objects: PageObject[]
}

export interface Source {
  id: string
  name: string
  bytes: Uint8Array
  doc: PDFDocumentProxy
}

export type Tool = 'select' | 'edit-text' | 'add-text' | 'highlight' | 'rect' | 'ellipse' | 'draw'

export interface DetectedText {
  key: string
  text: string
  /** Hot-spot box in page space (pt, top-left origin). */
  x: number
  y: number
  w: number
  h: number
  baseline: number
  size: number
  fontName: string
  isSubset: boolean
  embedded: boolean | null
  match: FontMatch
}
