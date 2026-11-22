import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjs }

export class PdfError extends Error {
  kind: 'password' | 'invalid'
  constructor(kind: 'password' | 'invalid', message: string) {
    super(message)
    this.kind = kind
  }
}

export async function loadDocument(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  try {
    // PDF.js transfers the buffer to its worker, so hand it a copy.
    return await pdfjs.getDocument({ data: bytes.slice() }).promise
  } catch (e) {
    const err = e as { name?: string }
    if (err?.name === 'PasswordException') {
      throw new PdfError('password', 'This PDF is password-protected. Password-protected files are not supported yet — remove the password and try again.')
    }
    throw new PdfError('invalid', 'This file could not be read as a PDF. It may be corrupted or not a PDF.')
  }
}

const pageCache = new Map<string, Promise<PDFPageProxy>>()

export function getSourcePage(sourceId: string, doc: PDFDocumentProxy, index: number): Promise<PDFPageProxy> {
  const key = `${sourceId}:${index}`
  let p = pageCache.get(key)
  if (!p) {
    p = doc.getPage(index + 1)
    pageCache.set(key, p)
  }
  return p
}

export function clearSourceCache(sourceId: string) {
  for (const k of [...pageCache.keys()]) if (k.startsWith(sourceId + ':')) pageCache.delete(k)
}
