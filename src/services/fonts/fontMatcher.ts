import { StandardFonts } from 'pdf-lib'
import type { FontMatch, StdFont } from '../../types'
import { FONT_LIBRARY, resolveBaseStd } from './fontLibrary'

export const FONT_FAMILIES: { id: StdFont; label: string; css: string }[] = [
  { id: 'Helvetica', label: 'Helvetica (Sans)', css: 'Helvetica, Arial, "Liberation Sans", sans-serif' },
  { id: 'Times', label: 'Times (Serif)', css: '"Times New Roman", Times, "Liberation Serif", serif' },
  { id: 'Courier', label: 'Courier (Mono)', css: '"Courier New", Courier, "Liberation Mono", monospace' },
]

export function cssFamily(family: string): string {
  if (family === 'Helvetica') return 'Helvetica, Arial, "Liberation Sans", sans-serif'
  if (family === 'Times' || family === 'Times New Roman') return '"Times New Roman", Times, "Liberation Serif", serif'
  if (family === 'Courier' || family === 'Courier New') return '"Courier New", Courier, "Liberation Mono", monospace'
  const found = FONT_LIBRARY.find((f) => f.id.toLowerCase() === family.toLowerCase() || f.name.toLowerCase() === family.toLowerCase())
  return found?.css ?? 'Helvetica, Arial, "Liberation Sans", sans-serif'
}

export function stdFontName(family: string, bold: boolean, italic: boolean): StandardFonts {
  const baseStd = family === 'Times' || family === 'Helvetica' || family === 'Courier'
    ? (family as StdFont)
    : resolveBaseStd(family)
  const k = `${baseStd}${bold ? 'B' : ''}${italic ? 'I' : ''}`
  switch (k) {
    case 'Helvetica': return StandardFonts.Helvetica
    case 'HelveticaB': return StandardFonts.HelveticaBold
    case 'HelveticaI': return StandardFonts.HelveticaOblique
    case 'HelveticaBI': return StandardFonts.HelveticaBoldOblique
    case 'Times': return StandardFonts.TimesRoman
    case 'TimesB': return StandardFonts.TimesRomanBold
    case 'TimesI': return StandardFonts.TimesRomanItalic
    case 'TimesBI': return StandardFonts.TimesRomanBoldItalic
    case 'Courier': return StandardFonts.Courier
    case 'CourierB': return StandardFonts.CourierBold
    case 'CourierI': return StandardFonts.CourierOblique
    default: return StandardFonts.CourierBoldOblique
  }
}

export const SUBSET_RE = /^[A-Z]{6}\+/

export interface RawFontInfo {
  name?: string
  bold?: boolean
  italic?: boolean
  isMonospace?: boolean
  isSerifFont?: boolean
  cssFamily?: string // generic family reported by PDF.js text styles
}

const STANDARD_ORIGINALS = /^(helvetica|times-?roman|times|courier)(-?(bold|italic|oblique|bolditalic|boldoblique))?$/i

/**
 * Maps whatever PDF.js tells us about a font onto the closest bundled
 * standard font (Times, Helvetica, Courier). Preserves original PDF typography
 * with exact document metric fidelity.
 */
export function matchFont(info: RawFontInfo): FontMatch {
  const raw = (info.name ?? '').trim()
  const isSerif = !!info.isSerifFont || info.cssFamily === 'serif' || /times|serif|georgia|garamond|cambria/i.test(raw)
  const isMono = !!info.isMonospace || info.cssFamily === 'monospace' || /courier|mono|consolas|menlo/i.test(raw)

  if (!raw) {
    const family: StdFont = isSerif ? 'Times' : isMono ? 'Courier' : 'Helvetica'
    return {
      family,
      stdFamily: family,
      bold: !!info.bold,
      italic: !!info.italic,
      status: 'unknown',
      note: 'Font information was not available. Standard fallback is used.',
    }
  }

  const name = raw.replace(SUBSET_RE, '').replace(/^\//, '').trim()
  const lower = name.toLowerCase()
  const bold = !!info.bold || /bold|black|heavy|semibold|demi/.test(lower)
  const italic = !!info.italic || /italic|oblique/.test(lower)

  let family: StdFont = 'Helvetica'
  let confident = true
  if (isMono || /courier|mono|consolas|menlo|typewriter/.test(lower)) {
    family = 'Courier'
  } else if (/times|georgia|garamond|cambria|palatino|minion|bookman|century|serif/i.test(lower) && !/sans/i.test(lower)) {
    family = 'Times'
  } else if (/helvetica|arial|liberation ?sans|calibri|verdana|tahoma|segoe|roboto|inter|open ?sans|noto ?sans/.test(lower)) {
    family = 'Helvetica'
  } else if (isSerif) {
    family = 'Times'
    confident = false
  } else {
    confident = false
  }

  const base = lower.replace(/[-,\s]*(bold|italic|oblique|regular|roman|mt|ps)+/g, '')
  if (STANDARD_ORIGINALS.test(lower.replace(/mt$/, '')) || /^(helvetica|courier|times-?roman)$/.test(base)) {
    return {
      family,
      stdFamily: family,
      bold,
      italic,
      status: 'original-available',
      note: `${name} is a standard PDF font (${family}).`,
    }
  }
  if (/^arial|liberation/.test(lower) && family === 'Helvetica') {
    return {
      family,
      stdFamily: family,
      bold,
      italic,
      status: 'similar',
      note: `${name} is substituted with Helvetica, which has near-identical metrics.`,
    }
  }
  return confident
    ? {
        family,
        stdFamily: family,
        bold,
        italic,
        status: 'similar',
        note: `${name} matched to standard PDF font (${family}).`,
      }
    : {
        family,
        stdFamily: family,
        bold,
        italic,
        status: 'substituted',
        note: `${name} could not be matched confidently; ${family} is used as substitute.`,
      }
}

export const STATUS_LABEL: Record<FontMatch['status'], string> = {
  'original-available': 'Original font available',
  similar: 'Similar font selected',
  substituted: 'Font substitution required',
  unknown: 'Font information unavailable',
}
