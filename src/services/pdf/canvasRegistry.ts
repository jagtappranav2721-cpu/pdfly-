/** Lets editing code read pixels from the already rendered page canvases. */
const canvases = new Map<string, HTMLCanvasElement>()

export function registerCanvas(pageId: string, el: HTMLCanvasElement | null) {
  if (el) canvases.set(pageId, el)
  else canvases.delete(pageId)
}

export function getCanvas(pageId: string): HTMLCanvasElement | undefined {
  return canvases.get(pageId)
}
