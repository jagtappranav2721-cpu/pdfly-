import { create } from 'zustand'

export type View = 'landing' | 'dashboard' | 'editor'

interface AppState {
  view: View
  go: (v: View) => void
}

export const useApp = create<AppState>((set) => ({
  view: 'landing',
  go: (view) => {
    set({ view })
    window.scrollTo({ top: 0 })
  },
}))
