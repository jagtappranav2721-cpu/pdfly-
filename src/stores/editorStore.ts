import { create } from 'zustand'
import type { PageModel, PageObject, Source, Tool } from '../types'
import { uid } from '../utils/id'

export type FitMode = 'width' | 'page' | 'custom'

/** Pixels per PDF point at 100% zoom (CSS 96dpi vs 72pt). */
export const BASE_SCALE = 96 / 72

interface EditorState {
  fileName: string
  sources: Record<string, Source>
  pages: PageModel[]
  past: PageModel[][]
  future: PageModel[][]
  lastKey: string | null
  lastAt: number

  currentPageId: string | null
  selected: { pageId: string; objId: string } | null
  tool: Tool
  editingId: string | null
  /** Set while a freshly created object is being typed into for the first time. */
  freshId: string | null
  scale: number
  fitMode: FitMode
  sidebarOpen: boolean

  loadDocument: (name: string, source: Source, pages: PageModel[]) => void
  reset: () => void
  addSourcePages: (source: Source, pages: PageModel[], afterPageId?: string | null) => void

  checkpoint: (key?: string) => void
  cancelLast: () => void
  undo: () => void
  redo: () => void

  addObject: (pageId: string, obj: PageObject) => void
  updateObject: (pageId: string, objId: string, patch: Partial<PageObject>) => void
  removeObject: (pageId: string, objId: string) => void

  addBlankPage: (afterPageId: string) => void
  duplicatePage: (pageId: string) => void
  deletePage: (pageId: string) => void
  rotatePage: (pageId: string, delta: number) => void
  movePage: (fromId: string, toId: string) => void

  setCurrentPage: (id: string) => void
  select: (sel: { pageId: string; objId: string } | null) => void
  setTool: (t: Tool) => void
  setEditing: (id: string | null, fresh?: boolean) => void
  setScale: (s: number, mode?: FitMode) => void
  setFitMode: (m: FitMode) => void
  toggleSidebar: () => void
}

const initial = {
  fileName: '',
  sources: {} as Record<string, Source>,
  pages: [] as PageModel[],
  past: [] as PageModel[][],
  future: [] as PageModel[][],
  lastKey: null as string | null,
  lastAt: 0,
  currentPageId: null as string | null,
  selected: null as EditorState['selected'],
  tool: 'select' as Tool,
  editingId: null as string | null,
  freshId: null as string | null,
  scale: BASE_SCALE,
  fitMode: 'width' as FitMode,
  sidebarOpen: true,
}

const MAX_HISTORY = 100

export const useEditor = create<EditorState>((set, get) => ({
  ...initial,

  loadDocument: (name, source, pages) =>
    set({
      ...initial,
      fileName: name,
      sources: { [source.id]: source },
      pages,
      currentPageId: pages[0]?.id ?? null,
      fitMode: 'width',
    }),

  reset: () => set({ ...initial, sources: {} }),

  addSourcePages: (source, newPages, afterPageId) => {
    get().checkpoint()
    set((s) => {
      const idx = afterPageId ? s.pages.findIndex((p) => p.id === afterPageId) + 1 : s.pages.length
      const pages = [...s.pages.slice(0, idx), ...newPages, ...s.pages.slice(idx)]
      return { pages, sources: { ...s.sources, [source.id]: source } }
    })
  },

  // --- history -----------------------------------------------------------
  checkpoint: (key) =>
    set((s) => {
      const now = Date.now()
      // Coalesce rapid edits of the same property (e.g. dragging a colour picker).
      if (key && key === s.lastKey && now - s.lastAt < 800) return { lastAt: now }
      return {
        past: [...s.past, s.pages].slice(-MAX_HISTORY),
        future: [],
        lastKey: key ?? null,
        lastAt: now,
      }
    }),

  cancelLast: () =>
    set((s) => {
      if (!s.past.length) return {}
      const prev = s.past[s.past.length - 1]
      return { pages: prev, past: s.past.slice(0, -1), lastKey: null }
    }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return {}
      const prev = s.past[s.past.length - 1]
      const ids = new Set(prev.map((p) => p.id))
      return {
        pages: prev,
        past: s.past.slice(0, -1),
        future: [...s.future, s.pages],
        lastKey: null,
        selected: null,
        editingId: null,
        currentPageId: s.currentPageId && ids.has(s.currentPageId) ? s.currentPageId : prev[0]?.id ?? null,
      }
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return {}
      const next = s.future[s.future.length - 1]
      const ids = new Set(next.map((p) => p.id))
      return {
        pages: next,
        future: s.future.slice(0, -1),
        past: [...s.past, s.pages],
        lastKey: null,
        selected: null,
        editingId: null,
        currentPageId: s.currentPageId && ids.has(s.currentPageId) ? s.currentPageId : next[0]?.id ?? null,
      }
    }),

  // --- objects -------------------------------------------------------------
  addObject: (pageId, obj) =>
    set((s) => ({
      pages: s.pages.map((p) => (p.id === pageId ? { ...p, objects: [...p.objects, obj] } : p)),
    })),

  updateObject: (pageId, objId, patch) =>
    set((s) => ({
      pages: s.pages.map((p) =>
        p.id === pageId
          ? { ...p, objects: p.objects.map((o) => (o.id === objId ? ({ ...o, ...patch } as PageObject) : o)) }
          : p,
      ),
    })),

  removeObject: (pageId, objId) =>
    set((s) => ({
      pages: s.pages.map((p) => (p.id === pageId ? { ...p, objects: p.objects.filter((o) => o.id !== objId) } : p)),
      selected: s.selected?.objId === objId ? null : s.selected,
      editingId: s.editingId === objId ? null : s.editingId,
    })),

  // --- pages ---------------------------------------------------------------
  addBlankPage: (afterPageId) => {
    get().checkpoint()
    set((s) => {
      const i = s.pages.findIndex((p) => p.id === afterPageId)
      const ref = s.pages[i]
      if (!ref) return {}
      const rotated = ref.rotation % 180 !== 0
      const blank: PageModel = {
        id: uid(), sourceId: null, srcIndex: 0,
        box: { x0: 0, y0: 0, w: ref.box.w, h: ref.box.h },
        rotation: rotated ? ref.rotation : 0, objects: [],
      }
      const pages = [...s.pages.slice(0, i + 1), blank, ...s.pages.slice(i + 1)]
      return { pages, currentPageId: blank.id }
    })
  },

  duplicatePage: (pageId) => {
    get().checkpoint()
    set((s) => {
      const i = s.pages.findIndex((p) => p.id === pageId)
      if (i < 0) return {}
      const src = s.pages[i]
      const copy: PageModel = { ...src, id: uid(), objects: src.objects.map((o) => ({ ...o, id: uid() })) }
      const pages = [...s.pages.slice(0, i + 1), copy, ...s.pages.slice(i + 1)]
      return { pages, currentPageId: copy.id }
    })
  },

  deletePage: (pageId) => {
    if (get().pages.length <= 1) return
    get().checkpoint()
    set((s) => {
      const i = s.pages.findIndex((p) => p.id === pageId)
      const pages = s.pages.filter((p) => p.id !== pageId)
      const cur = s.currentPageId === pageId ? pages[Math.min(i, pages.length - 1)].id : s.currentPageId
      return { pages, currentPageId: cur, selected: null, editingId: null }
    })
  },

  rotatePage: (pageId, delta) => {
    get().checkpoint()
    set((s) => ({
      pages: s.pages.map((p) => (p.id === pageId ? { ...p, rotation: (((p.rotation + delta) % 360) + 360) % 360 } : p)),
    }))
  },

  movePage: (fromId, toId) => {
    if (fromId === toId) return
    get().checkpoint()
    set((s) => {
      const from = s.pages.findIndex((p) => p.id === fromId)
      const to = s.pages.findIndex((p) => p.id === toId)
      if (from < 0 || to < 0) return {}
      const pages = [...s.pages]
      const [m] = pages.splice(from, 1)
      pages.splice(to, 0, m)
      return { pages }
    })
  },

  // --- view ----------------------------------------------------------------
  setCurrentPage: (id) => set({ currentPageId: id }),
  select: (sel) => set({ selected: sel }),
  setTool: (t) => set({ tool: t, editingId: null, selected: t === 'select' ? get().selected : null }),
  setEditing: (id, fresh = false) => set({ editingId: id, freshId: fresh ? id : null }),
  setScale: (s, mode = 'custom') => set({ scale: Math.min(6, Math.max(0.3, s)), fitMode: mode }),
  setFitMode: (m) => set({ fitMode: m }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))

export function selectedObject(): PageObject | null {
  const { selected, pages } = useEditor.getState()
  if (!selected) return null
  return pages.find((p) => p.id === selected.pageId)?.objects.find((o) => o.id === selected.objId) ?? null
}
