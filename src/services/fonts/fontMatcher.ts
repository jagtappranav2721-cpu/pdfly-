import { StandardFonts } from 'pdf-lib'
import type { FontMatch, StdFont } from '../../types'

export const FONT_FAMILIES: { id: StdFont; label: string; css: string }[] = [
  { id: 'Helvetica', label: 'Helvetica (Sans)', css: 'Helvetica, Arial, "Liberation Sans", sans-serif' },
  { id: 'Times', label: 'Times (Serif)', css: '"Times New Roman", Times, "Liberation Serif", serif' },
  { id: 'Courier', label: 'Courier (Mono)', css: '"Courier New", Courier, "Liberation Mono", monospace' },
]

export function cssFamily(f: StdFont): string {
  return FONT_FAMILIES.find((x) => x.id === f)!.css
}

export function stdFontName(family: StdFont, bold: boolean, italic: boolean): StandardFonts {
  const k = `${family}${bold ? 'B' : ''}${italic ? 'I' : ''}`
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
 * standard font. Never claims an exact match unless the original font IS
 * one of the standard-14 families. Original embedded fonts are not reused.
 */
export function matchFont(info: RawFontInfo): FontMatch {
  const raw = (info.name ?? '').trim()
  if (!raw) {
    return {
      family: info.cssFamily === 'serif' ? 'Times' : info.cssFamily === 'monospace' ? 'Courier' : 'Helvetica',
      bold: !!info.bold,
      italic: !!info.italic,
      status: 'unknown',
      note: 'Font information was not available. Helvetica (or the nearest generic family) is used.',
    }
  }
  const name = raw.replace(SUBSET_RE, '')
  const lower = name.toLowerCase()
  const bold = !!info.bold || /bold|black|heavy|semibold|demi/.test(lower)
  const italic = !!info.italic || /italic|oblique/.test(lower)

  let family: StdFont = 'Helvetica'
  let confident = true
  if (info.isMonospace || /courier|mono|consolas|menlo|typewriter/.test(lower)) family = 'Courier'
  else if (/times|georgia|garamond|cambria|palatino|minion|bookman|century|serif(?!.*sans)/.test(lower) && !/sans/.test(lower)) family = 'Times'
  else if (/helvetica|arial|liberation ?sans|calibri|verdana|tahoma|segoe|roboto|inter|open ?sans|noto ?sans/.test(lower)) family = 'Helvetica'
  else if (info.isSerifFont || info.cssFamily === 'serif') { family = 'Times'; confident = false }
  else confident = false

  const base = lower.replace(/[-,\s]*(bold|italic|oblique|regular|roman|mt|ps)+/g, '')
  if (STANDARD_ORIGINALS.test(lower.replace(/mt$/, '')) || /^(helvetica|courier|times-?roman)$/.test(base)) {
    return {
      family, bold, italic, status: 'original-available',
      note: `${name} is a standard PDF font, so the same face is used for the replacement.`,
    }
  }
  if (/^arial|liberation/.test(lower) && family === 'Helvetica') {
    return {
      family, bold, italic, status: 'similar',
      note: `${name} is substituted with Helvetica, which has near-identical metrics. It is not the original font.`,
    }
  }
  return confident
    ? { family, bold, italic, status: 'similar',
        note: `${name} is substituted with a similar bundled font (${family}). It is not the original font.` }
    : { family, bold, italic, status: 'substituted',
        note: `${name} could not be matched confidently; ${family} is used as a substitute. Pick another font if it looks wrong.` }
}

export const STATUS_LABEL: Record<FontMatch['status'], string> = {
  'original-available': 'Original font available',
  similar: 'Similar font selected',
  substituted: 'Font substitution required',
  unknown: 'Font information unavailable',
}
