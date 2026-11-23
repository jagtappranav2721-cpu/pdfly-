import type { StdFont } from '../../types'

export type FontCategory = 'Sans Serif' | 'Serif' | 'Monospace' | 'Display'

export interface FontDefinition {
  id: string
  name: string
  category: FontCategory
  css: string
  baseStd: StdFont
  googleFont?: string
  isSystem?: boolean
}

export const FONT_LIBRARY: FontDefinition[] = [
  // --- Sans Serif (20+) ---
  { id: 'Arial', name: 'Arial', category: 'Sans Serif', css: 'Arial, sans-serif', baseStd: 'Helvetica', isSystem: true },
  { id: 'Helvetica', name: 'Helvetica', category: 'Sans Serif', css: 'Helvetica, Arial, sans-serif', baseStd: 'Helvetica', isSystem: true },
  { id: 'Roboto', name: 'Roboto', category: 'Sans Serif', css: '"Roboto", sans-serif', baseStd: 'Helvetica', googleFont: 'Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400' },
  { id: 'Open Sans', name: 'Open Sans', category: 'Sans Serif', css: '"Open Sans", sans-serif', baseStd: 'Helvetica', googleFont: 'Open+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { id: 'Lato', name: 'Lato', category: 'Sans Serif', css: '"Lato", sans-serif', baseStd: 'Helvetica', googleFont: 'Lato:ital,wght@0,300;0,400;0,700;1,400' },
  { id: 'Montserrat', name: 'Montserrat', category: 'Sans Serif', css: '"Montserrat", sans-serif', baseStd: 'Helvetica', googleFont: 'Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400' },
  { id: 'Poppins', name: 'Poppins', category: 'Sans Serif', css: '"Poppins", sans-serif', baseStd: 'Helvetica', googleFont: 'Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400' },
  { id: 'Inter', name: 'Inter', category: 'Sans Serif', css: '"Inter", sans-serif', baseStd: 'Helvetica', googleFont: 'Inter:wght@300;400;500;600;700' },
  { id: 'Nunito', name: 'Nunito', category: 'Sans Serif', css: '"Nunito", sans-serif', baseStd: 'Helvetica', googleFont: 'Nunito:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { id: 'Source Sans 3', name: 'Source Sans 3', category: 'Sans Serif', css: '"Source Sans 3", sans-serif', baseStd: 'Helvetica', googleFont: 'Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { id: 'Ubuntu', name: 'Ubuntu', category: 'Sans Serif', css: '"Ubuntu", sans-serif', baseStd: 'Helvetica', googleFont: 'Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,400' },
  { id: 'Raleway', name: 'Raleway', category: 'Sans Serif', css: '"Raleway", sans-serif', baseStd: 'Helvetica', googleFont: 'Raleway:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { id: 'Work Sans', name: 'Work Sans', category: 'Sans Serif', css: '"Work Sans", sans-serif', baseStd: 'Helvetica', googleFont: 'Work+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { id: 'Fira Sans', name: 'Fira Sans', category: 'Sans Serif', css: '"Fira Sans", sans-serif', baseStd: 'Helvetica', googleFont: 'Fira+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400' },
  { id: 'Noto Sans', name: 'Noto Sans', category: 'Sans Serif', css: '"Noto Sans", sans-serif', baseStd: 'Helvetica', googleFont: 'Noto+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { id: 'PT Sans', name: 'PT Sans', category: 'Sans Serif', css: '"PT Sans", sans-serif', baseStd: 'Helvetica', googleFont: 'PT+Sans:ital,wght@0,400;0,700;1,400' },
  { id: 'DM Sans', name: 'DM Sans', category: 'Sans Serif', css: '"DM Sans", sans-serif', baseStd: 'Helvetica', googleFont: 'DM+Sans:ital,wght@0,400;0,500;0,700;1,400' },
  { id: 'Manrope', name: 'Manrope', category: 'Sans Serif', css: '"Manrope", sans-serif', baseStd: 'Helvetica', googleFont: 'Manrope:wght@300;400;500;600;700' },
  { id: 'Rubik', name: 'Rubik', category: 'Sans Serif', css: '"Rubik", sans-serif', baseStd: 'Helvetica', googleFont: 'Rubik:ital,wght@0,300;0,400;0,500;0,700;1,400' },
  { id: 'Mulish', name: 'Mulish', category: 'Sans Serif', css: '"Mulish", sans-serif', baseStd: 'Helvetica', googleFont: 'Mulish:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { id: 'Comfortaa', name: 'Comfortaa', category: 'Sans Serif', css: '"Comfortaa", cursive', baseStd: 'Helvetica', googleFont: 'Comfortaa:wght@400;700' },

  // --- Serif (10+) ---
  { id: 'Times New Roman', name: 'Times New Roman', category: 'Serif', css: '"Times New Roman", Times, serif', baseStd: 'Times', isSystem: true },
  { id: 'Georgia', name: 'Georgia', category: 'Serif', css: 'Georgia, serif', baseStd: 'Times', isSystem: true },
  { id: 'Merriweather', name: 'Merriweather', category: 'Serif', css: '"Merriweather", serif', baseStd: 'Times', googleFont: 'Merriweather:ital,wght@0,300;0,400;0,700;1,400' },
  { id: 'Lora', name: 'Lora', category: 'Serif', css: '"Lora", serif', baseStd: 'Times', googleFont: 'Lora:ital,wght@0,400;0,600;0,700;1,400' },
  { id: 'Playfair Display', name: 'Playfair Display', category: 'Serif', css: '"Playfair Display", serif', baseStd: 'Times', googleFont: 'Playfair+Display:ital,wght@0,400;0,600;0,700;1,400' },
  { id: 'Libre Baskerville', name: 'Libre Baskerville', category: 'Serif', css: '"Libre Baskerville", serif', baseStd: 'Times', googleFont: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400' },
  { id: 'Crimson Text', name: 'Crimson Text', category: 'Serif', css: '"Crimson Text", serif', baseStd: 'Times', googleFont: 'Crimson+Text:ital,wght@0,400;0,600;0,700;1,400' },
  { id: 'EB Garamond', name: 'EB Garamond', category: 'Serif', css: '"EB Garamond", serif', baseStd: 'Times', googleFont: 'EB+Garamond:ital,wght@0,400;0,600;0,700;1,400' },
  { id: 'Cormorant Garamond', name: 'Cormorant Garamond', category: 'Serif', css: '"Cormorant Garamond", serif', baseStd: 'Times', googleFont: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400' },
  { id: 'Source Serif 4', name: 'Source Serif 4', category: 'Serif', css: '"Source Serif 4", serif', baseStd: 'Times', googleFont: 'Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400' },
  { id: 'Cinzel', name: 'Cinzel', category: 'Serif', css: '"Cinzel", serif', baseStd: 'Times', googleFont: 'Cinzel:wght@400;600;700' },

  // --- Monospace (7+) ---
  { id: 'Courier New', name: 'Courier New', category: 'Monospace', css: '"Courier New", Courier, monospace', baseStd: 'Courier', isSystem: true },
  { id: 'Courier', name: 'Courier', category: 'Monospace', css: 'Courier, monospace', baseStd: 'Courier', isSystem: true },
  { id: 'Roboto Mono', name: 'Roboto Mono', category: 'Monospace', css: '"Roboto Mono", monospace', baseStd: 'Courier', googleFont: 'Roboto+Mono:ital,wght@0,400;0,600;1,400' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono', category: 'Monospace', css: '"JetBrains Mono", monospace', baseStd: 'Courier', googleFont: 'JetBrains+Mono:wght@400;600;700' },
  { id: 'Fira Code', name: 'Fira Code', category: 'Monospace', css: '"Fira Code", monospace', baseStd: 'Courier', googleFont: 'Fira+Code:wght@400;600;700' },
  { id: 'Source Code Pro', name: 'Source Code Pro', category: 'Monospace', css: '"Source Code Pro", monospace', baseStd: 'Courier', googleFont: 'Source+Code+Pro:ital,wght@0,400;0,600;1,400' },
  { id: 'IBM Plex Mono', name: 'IBM Plex Mono', category: 'Monospace', css: '"IBM Plex Mono", monospace', baseStd: 'Courier', googleFont: 'IBM+Plex+Mono:ital,wght@0,400;0,600;1,400' },
  { id: 'Space Mono', name: 'Space Mono', category: 'Monospace', css: '"Space Mono", monospace', baseStd: 'Courier', googleFont: 'Space+Mono:ital,wght@0,400;0,700;1,400' },

  // --- Display & Decorative (11+) ---
  { id: 'Lobster Two', name: 'Lobster Two', category: 'Display', css: '"Lobster Two", cursive', baseStd: 'Times', googleFont: 'Lobster+Two:ital,wght@0,400;0,700;1,400;1,700' },
  { id: 'Bangers', name: 'Bangers', category: 'Display', css: '"Bangers", cursive', baseStd: 'Helvetica', googleFont: 'Bangers' },
  { id: 'Oswald', name: 'Oswald', category: 'Display', css: '"Oswald", sans-serif', baseStd: 'Helvetica', googleFont: 'Oswald:wght@400;600;700' },
  { id: 'Bebas Neue', name: 'Bebas Neue', category: 'Display', css: '"Bebas Neue", sans-serif', baseStd: 'Helvetica', googleFont: 'Bebas+Neue' },
  { id: 'Anton', name: 'Anton', category: 'Display', css: '"Anton", sans-serif', baseStd: 'Helvetica', googleFont: 'Anton' },
  { id: 'Abril Fatface', name: 'Abril Fatface', category: 'Display', css: '"Abril Fatface", serif', baseStd: 'Times', googleFont: 'Abril+Fatface' },
  { id: 'Dancing Script', name: 'Dancing Script', category: 'Display', css: '"Dancing Script", cursive', baseStd: 'Times', googleFont: 'Dancing+Script:wght@400;600;700' },
  { id: 'Pacifico', name: 'Pacifico', category: 'Display', css: '"Pacifico", cursive', baseStd: 'Times', googleFont: 'Pacifico' },
  { id: 'Caveat', name: 'Caveat', category: 'Display', css: '"Caveat", cursive', baseStd: 'Helvetica', googleFont: 'Caveat:wght@400;600;700' },
  { id: 'Playwrite DE LA Guides', name: 'Playwrite DE LA Guides', category: 'Display', css: '"Playwrite DE LA Guides", cursive', baseStd: 'Times', googleFont: 'Playwrite+DE+LA+Guides' },
  { id: 'Zalando Sans Expanded', name: 'Zalando Sans Expanded', category: 'Display', css: '"Zalando Sans Expanded", sans-serif', baseStd: 'Helvetica', googleFont: 'Zalando+Sans+Expanded:ital,wght@0,400;0,700;1,400' },
  { id: 'Great Vibes', name: 'Great Vibes', category: 'Display', css: '"Great Vibes", cursive', baseStd: 'Times', googleFont: 'Great+Vibes' },
] as const

const loadedFonts = new Set<string>()

/** Dynamically injects Google Font link tag when a font is selected or previewed */
export function loadFontResource(fontDef: FontDefinition) {
  if (!fontDef.googleFont || loadedFonts.has(fontDef.id)) return
  loadedFonts.add(fontDef.id)

  const id = `google-font-${fontDef.id.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontDef.googleFont}&display=swap`
  document.head.appendChild(link)
}

/** Preload essential fonts */
export function ensureFontLoaded(family: string) {
  const font = FONT_LIBRARY.find((f) => f.id.toLowerCase() === family.toLowerCase() || f.name.toLowerCase() === family.toLowerCase())
  if (font) {
    loadFontResource(font)
  }
}

export function getFontDefinition(family: string): FontDefinition {
  const clean = (family || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const found = FONT_LIBRARY.find((f) => {
    const fClean = f.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const idClean = f.id.toLowerCase().replace(/[^a-z0-9]/g, '')
    return clean === fClean || clean === idClean
  })
  return found ?? FONT_LIBRARY.find((f) => f.name === 'Helvetica') ?? FONT_LIBRARY[0]
}

export function resolveCssFamily(family: string): string {
  const def = getFontDefinition(family)
  return def.css
}

export function resolveBaseStd(family: string): StdFont {
  const def = getFontDefinition(family)
  return def.baseStd
}

const RECENT_KEY = 'pdfly-recent-fonts'

export function getRecentFonts(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return ['Montserrat', 'Roboto', 'Arial', 'Times New Roman']
    return JSON.parse(raw) as string[]
  } catch {
    return ['Montserrat', 'Roboto', 'Arial', 'Times New Roman']
  }
}

export function addRecentFont(family: string) {
  try {
    const recent = getRecentFonts().filter((f) => f.toLowerCase() !== family.toLowerCase())
    recent.unshift(family)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 6)))
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Intelligent font detector & recommender:
 * Matches raw PDF font name (e.g. 'BCDFEE+Roboto-Bold', 'Calibri', 'TimesNewRomanPSMT')
 * to the best available font in our 50+ library.
 */
export function recommendFontFromPdfName(
  rawName: string,
  isSerif?: boolean,
  isMono?: boolean,
): { font: FontDefinition; confidence: 'exact' | 'high' | 'approximate' | 'fallback'; note: string } {
  const clean = (rawName || '').replace(/^[A-Z]{6}\+/, '').replace(/^\//, '').trim()
  const alpha = clean.toLowerCase().replace(/[^a-z0-9]/g, '')

  if (!alpha) {
    const fallback = isSerif ? getFontDefinition('Times New Roman') : isMono ? getFontDefinition('Courier New') : getFontDefinition('Helvetica')
    return { font: fallback, confidence: 'fallback', note: 'Font metadata was unavailable; standard fallback selected.' }
  }

  // 1. Direct or normalized exact match with our library
  for (const f of FONT_LIBRARY) {
    const fAlpha = f.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (alpha === fAlpha) {
      return { font: f, confidence: 'exact', note: `Detected and matched to ${f.name}.` }
    }
  }

  // 2. High-confidence prefix match (e.g. 'timesnewromanpsmt' -> 'timesnewroman')
  for (const f of FONT_LIBRARY) {
    const fAlpha = f.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (fAlpha.length >= 4 && alpha.startsWith(fAlpha)) {
      return { font: f, confidence: 'exact', note: `Matched ${f.name} from ${clean}.` }
    }
  }

  // 3. Known PDF font aliases & common document families
  if (/times|cambria|georgia|palatino|garamond|minion|baskerville/i.test(alpha)) {
    if (/georgia/i.test(alpha)) return { font: getFontDefinition('Georgia'), confidence: 'exact', note: 'Matched Georgia.' }
    if (/garamond/i.test(alpha)) return { font: getFontDefinition('EB Garamond'), confidence: 'high', note: 'Matched Garamond.' }
    if (/baskerville/i.test(alpha)) return { font: getFontDefinition('Libre Baskerville'), confidence: 'high', note: 'Matched Baskerville.' }
    const f = getFontDefinition('Times New Roman')
    return { font: f, confidence: 'high', note: `Serif document font matched to ${f.name}.` }
  }

  if (/courier|consolas|menlo|monaco|typewriter/i.test(alpha) || isMono) {
    if (/roboto.*mono/i.test(alpha)) return { font: getFontDefinition('Roboto Mono'), confidence: 'exact', note: 'Matched Roboto Mono.' }
    if (/jetbrains/i.test(alpha)) return { font: getFontDefinition('JetBrains Mono'), confidence: 'exact', note: 'Matched JetBrains Mono.' }
    if (/fira.*code/i.test(alpha)) return { font: getFontDefinition('Fira Code'), confidence: 'exact', note: 'Matched Fira Code.' }
    const f = getFontDefinition('Courier New')
    return { font: f, confidence: 'high', note: `Monospace document font matched to ${f.name}.` }
  }

  if (/helvetica/i.test(alpha)) {
    const f = getFontDefinition('Helvetica')
    return { font: f, confidence: 'exact', note: `Matched standard PDF font Helvetica.` }
  }

  if (/arial|liberationsans/i.test(alpha)) {
    const f = getFontDefinition('Arial')
    return { font: f, confidence: 'exact', note: `Matched to ${f.name}.` }
  }

  if (/calibri|segoe/i.test(alpha)) {
    const f = getFontDefinition('Open Sans')
    return { font: f, confidence: 'high', note: `Matched modern sans font to ${f.name}.` }
  }

  if (/roboto/i.test(alpha)) {
    const f = getFontDefinition('Roboto')
    return { font: f, confidence: 'exact', note: `Matched to ${f.name}.` }
  }

  if (/montserrat/i.test(alpha)) {
    const f = getFontDefinition('Montserrat')
    return { font: f, confidence: 'exact', note: `Matched to ${f.name}.` }
  }

  if (/inter/i.test(alpha)) {
    const f = getFontDefinition('Inter')
    return { font: f, confidence: 'exact', note: `Matched to ${f.name}.` }
  }

  if (/poppins/i.test(alpha)) {
    const f = getFontDefinition('Poppins')
    return { font: f, confidence: 'exact', note: `Matched to ${f.name}.` }
  }

  // 4. Substring match against library
  for (const f of FONT_LIBRARY) {
    const fAlpha = f.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (fAlpha.length >= 4 && alpha.includes(fAlpha)) {
      return { font: f, confidence: 'high', note: `Matched to ${f.name}.` }
    }
  }

  // 5. Category fallback
  if (isSerif) {
    const f = getFontDefinition('Times New Roman')
    return { font: f, confidence: 'approximate', note: `Serif style detected; using ${f.name}.` }
  }
  if (isMono) {
    const f = getFontDefinition('Courier New')
    return { font: f, confidence: 'approximate', note: `Monospace style detected; using ${f.name}.` }
  }

  const f = getFontDefinition('Helvetica')
  return { font: f, confidence: 'fallback', note: `Standard clean font (${f.name}) selected.` }
}
