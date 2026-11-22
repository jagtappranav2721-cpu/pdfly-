# PDFly

A free, open-source PDF editor that runs entirely in your browser. No accounts, no analytics, no uploads.

> **Status: first implementation, not yet built.**
> The source was written in an environment without npm access, so the app has never been compiled or run in a browser.
> Only the export engine (`src/services/pdf/exporter.ts`) was smoke-tested in Node against a generated PDF: page copying, page
> rotation, blank pages, overlay text edit with cover, rotated centred text, image, highlight, ellipse and freehand path all
> exported and rendered correctly. Everything else (UI, PDF.js rendering, text detection, font matching, colour sampling) is untested.
> Expect type errors and small bugs on first `npm run dev`. The checklist at the bottom is the acceptance list.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build
```

Requires Node 20+. `package.json` uses `latest` ranges because versions could not be resolved offline; after the first
successful install, commit `package-lock.json` to pin them. If a major release changed an API, the first things to check are
the PDF.js worker import (`src/services/pdf/pdfjs.ts`) and the `render()` parameters (`src/hooks/usePageRender.ts`).

## What works (as designed)

- Open a PDF (drag & drop or file picker); recents are kept in this browser's IndexedDB and can be removed.
- High-DPI, lazily rendered pages with zoom, fit-width, fit-page and page navigation. Pages far off-screen release their canvas.
- **Edit text** tool: click an existing line of text to edit it. Font name, subset/embedded status, size and an estimated colour are shown.
- Add text; family, size, bold, italic, underline, colour, alignment, position, opacity.
- Images (PNG, JPEG, WebP→PNG): insert, drag from the desktop onto a page, move, resize, rotate, opacity, replace, delete.
- Highlight, rectangle, ellipse, freehand drawing.
- Pages: reorder (drag), rotate, duplicate, delete, insert blank, **merge** another PDF, download a single page.
- Undo / redo (coalesced for rapid property changes), keyboard shortcuts (V, T, Delete, Ctrl+Z, Ctrl+Shift+Z).
- Export with progress, a preview dialog and a `*-edited.pdf` download.

## How text editing works — and its limits

PDF stores text as positioned glyph IDs, not paragraphs, and the libraries chosen cannot rewrite it:

| Library | Can it replace existing page text? |
|---|---|
| PDF.js | No — read-only. Provides text runs, positions, sizes and font names. |
| pdf-lib | No — it can draw new content and edit form fields, but cannot modify text already in a page's content stream. |
| MuPDF.js | Yes, but it is **AGPL**, which would make the whole app AGPL. Not used. |

So edits are **overlay-based**:

1. PDF.js detects the text run (position, size, font name, subset flag).
2. The run's area is covered with a rectangle in the background colour sampled from the rendered page.
3. The replacement is drawn on top in the closest bundled standard font (Helvetica / Times / Courier families).

The properties panel labels every such edit as an overlay edit and reports one of: *Original font available* (only when the
original is itself a standard PDF font), *Similar font selected*, *Font substitution required*, *Font information unavailable*.
The original embedded font is **never reused**, and the UI never claims otherwise.

Consequences you should know about:

- The original glyphs are still in the file underneath the cover patch. **Do not use this for redaction.**
- Text colour and background colour are estimated from pixels, so gradients or images behind text may show a visible patch.
- Replacement text is not reflowed and is not scaled to the original width.
- Only horizontal, unrotated runs are editable. Runs are PDF.js text items, which are often words or line fragments, not paragraphs.
- Standard fonts only cover Latin text (WinAnsi); other characters become `?` and a warning is shown on export.
- Character/line spacing controls are not offered because they cannot be applied reliably yet.

### Planned: native replacement

A second path would parse the page content stream, remove the `Tj`/`TJ` operators inside the run's bounding box, and draw the new
text with an embedded font (open projects such as rihaPDF do this). It works for simple fonts and fails for many subset/CID
encodings. It was left out of this first pass because it cannot be verified without running real documents.

## Not implemented yet

- **OCR for scanned PDFs** (Tesseract.js) — planned; no code exists.
- **Password-protected PDFs** — detected and rejected with a clear message (pdf-lib cannot decrypt on export).
- Split into multiple files (single-page download exists), Web Worker offloading beyond PDF.js's own worker, rotation of existing text.

## Architecture

```
src/
  components/{common,landing,dashboard,editor/{toolbar,canvas,sidebar,properties,pages}}
  hooks/        useOpenPdf, usePageRender, useVisible
  stores/       editorStore (Zustand: pages, history, tools, view), appStore (landing/dashboard/editor)
  services/
    pdf/        pdfjs (worker + loader), textDetection, pixelSampling, exporter, images, canvasRegistry
    fonts/      fontMatcher (metadata → bundled standard font + status)
    storage/    recent (IndexedDB)
  types/ utils/ styles/ config.ts (branding)
```

- Pages are rendered **unrotated** and rotated with CSS, so all object coordinates live in one stable page space (points, top-left origin). The exporter converts to PDF space.
- Export copies original pages with pdf-lib (`copyPages`) — nothing is rasterised — then draws covers, text, images and shapes on top.
- Editor and exporter share text metrics (`utils/textMetrics.ts`) so on-screen and exported text positions agree.
- Fabric.js was deliberately **not** used: a small DOM overlay covers text, image and shape handling without an extra dependency.

## Privacy

Documents are processed in the browser. Nothing is uploaded and no analytics are included. Fonts are bundled
(`@fontsource-variable/inter`), so no CDN requests are made. Recent files are stored only in IndexedDB on your device.
Application code never logs document content.

## Licensing

PDFly code: MIT (see `LICENSE`). Direct dependencies — please verify with `npx license-checker --summary` after install:

| Package | License |
|---|---|
| react, react-dom, zustand, lucide-react, vite, @vitejs/plugin-react, @types/* | MIT |
| pdfjs-dist (PDF.js) | Apache-2.0 |
| pdf-lib | MIT |
| tailwindcss, @tailwindcss/vite | MIT |
| @fontsource-variable/inter | OFL-1.1 (font) / MIT (package) |
| typescript | Apache-2.0 |

The bundled PDF fonts are the 14 standard PDF fonts referenced by name; no font files are redistributed.

## Acceptance checklist (run these with real PDFs)

1. Upload a multi-page PDF; every page renders.
2. Click text; confirm font name, subset flag and size in the panel.
3. Replace text; position and size match the original.
4. Change size and colour; toggle bold and italic.
5. Insert and resize an image.
6. Reorder, rotate, duplicate and delete pages.
7. Export, reopen in another viewer, and compare against the editor.
8. Confirm untouched text, images and vectors are unchanged (select the text; file size close to the original).
9. Test a PDF with subset fonts, a PDF with /Rotate set, and a PDF with a non-zero CropBox origin.
10. Check tablet width (the properties panel hides below 768px) and a 100+ page document for responsiveness.
