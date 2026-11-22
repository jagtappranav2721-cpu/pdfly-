import { useCallback, useState } from 'react'
import { openPdfBytes } from '../services/pdf/loader'
import { saveRecent } from '../services/storage/recent'
import { useEditor } from '../stores/editorStore'
import { useApp } from '../stores/appStore'

export function useOpenPdf() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openBytes = useCallback(async (bytes: Uint8Array, name: string) => {
    setLoading(true)
    setError(null)
    try {
      const { source, pages } = await openPdfBytes(bytes, name)
      if (!pages.length) throw new Error('This PDF has no pages.')
      useEditor.getState().loadDocument(name, source, pages)
      void saveRecent(name, bytes)
      useApp.getState().go('editor')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open this file.')
    } finally {
      setLoading(false)
    }
  }, [])

  const openFile = useCallback(
    async (file: File) => {
      const looksLikePdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
      if (!looksLikePdf) {
        setError('Please choose a PDF file.')
        return
      }
      const bytes = new Uint8Array(await file.arrayBuffer())
      await openBytes(bytes, file.name)
    },
    [openBytes],
  )

  return { openFile, openBytes, loading, error, clearError: () => setError(null) }
}
