import { create } from 'zustand'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  eyeComfort: boolean
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  toggleEyeComfort: () => void
}

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem('pdfly-theme')
    if (saved === 'dark' || saved === 'light') return saved
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch {
    // fallback
  }
  return 'light'
}

function getInitialEyeComfort(): boolean {
  try {
    return localStorage.getItem('pdfly-eye-comfort') === 'true'
  } catch {
    return false
  }
}

function applyThemeClasses(theme: Theme, eyeComfort: boolean) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }

  if (eyeComfort) {
    root.classList.add('eye-comfort')
  } else {
    root.classList.remove('eye-comfort')
  }
}

const initialTheme = getInitialTheme()
const initialEyeComfort = getInitialEyeComfort()
applyThemeClasses(initialTheme, initialEyeComfort)

export const useTheme = create<ThemeState>((set) => ({
  theme: initialTheme,
  eyeComfort: initialEyeComfort,
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem('pdfly-theme', next)
      } catch {
        /* storage may be blocked */
      }
      applyThemeClasses(next, s.eyeComfort)
      return { theme: next }
    }),
  setTheme: (theme) =>
    set((s) => {
      try {
        localStorage.setItem('pdfly-theme', theme)
      } catch {
        /* storage may be blocked */
      }
      applyThemeClasses(theme, s.eyeComfort)
      return { theme }
    }),
  toggleEyeComfort: () =>
    set((s) => {
      const next = !s.eyeComfort
      try {
        localStorage.setItem('pdfly-eye-comfort', String(next))
      } catch {
        /* storage may be blocked */
      }
      applyThemeClasses(s.theme, next)
      return { eyeComfort: next }
    }),
}))
