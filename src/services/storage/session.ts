import type { PageModel } from '../../types'

export interface SavedSession {
  id: string
  name: string
  savedAt: number
  bytes: Uint8Array
  pages: PageModel[]
  currentPageId: string | null
}

const DB_NAME = 'pdfly-studio-db'
const STORE_NAME = 'sessions'
const SESSION_KEY = 'active-session'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveSession(
  name: string,
  bytes: Uint8Array,
  pages: PageModel[],
  currentPageId: string | null,
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const session: SavedSession = {
      id: SESSION_KEY,
      name,
      savedAt: Date.now(),
      bytes,
      pages,
      currentPageId,
    }
    const req = store.put(session, SESSION_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function loadSavedSession(): Promise<SavedSession | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(SESSION_KEY)
      req.onsuccess = () => resolve((req.result as SavedSession) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function clearSavedSession(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(SESSION_KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    /* ignore */
  }
}

export async function hasSavedSession(): Promise<boolean> {
  const s = await loadSavedSession()
  return s !== null
}
