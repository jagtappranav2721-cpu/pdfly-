/** Recently opened documents, kept only in this browser's IndexedDB. */
export interface RecentDoc {
  id: string
  name: string
  size: number
  openedAt: number
  bytes: Uint8Array
}

const DB = 'pdfly'
const STORE = 'recent'
const MAX_ITEMS = 6
const MAX_BYTES = 40 * 1024 * 1024

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const r = fn(t.objectStore(STORE))
        r.onsuccess = () => resolve(r.result)
        r.onerror = () => reject(r.error)
        t.oncomplete = () => db.close()
      }),
  )
}

export async function listRecent(): Promise<Omit<RecentDoc, 'bytes'>[]> {
  try {
    const all = (await tx('readonly', (s) => s.getAll())) as RecentDoc[]
    return all
      .sort((a, b) => b.openedAt - a.openedAt)
      .map(({ id, name, size, openedAt }) => ({ id, name, size, openedAt }))
  } catch {
    return []
  }
}

export async function saveRecent(name: string, bytes: Uint8Array): Promise<void> {
  if (bytes.byteLength > MAX_BYTES) return
  try {
    const all = (await tx('readonly', (s) => s.getAll())) as RecentDoc[]
    const existing = all.find((d) => d.name === name && d.size === bytes.byteLength)
    const doc: RecentDoc = {
      id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name, size: bytes.byteLength, openedAt: Date.now(), bytes,
    }
    await tx('readwrite', (s) => s.put(doc))
    const sorted = all.filter((d) => d.id !== doc.id).sort((a, b) => b.openedAt - a.openedAt)
    for (const old of sorted.slice(MAX_ITEMS - 1)) await tx('readwrite', (s) => s.delete(old.id))
  } catch {
    /* storage unavailable (private mode etc.) — recents are optional */
  }
}

export async function loadRecent(id: string): Promise<RecentDoc | undefined> {
  try {
    return (await tx('readonly', (s) => s.get(id))) as RecentDoc | undefined
  } catch {
    return undefined
  }
}

export async function removeRecent(id: string): Promise<void> {
  try {
    await tx('readwrite', (s) => s.delete(id))
  } catch {
    /* ignore */
  }
}
