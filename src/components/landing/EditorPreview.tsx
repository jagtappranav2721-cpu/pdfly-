/** Static illustration of the editor layout for the landing page (decorative only). */
export default function EditorPreview() {
  return (
    <div
      aria-hidden
      className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-line bg-surface text-left shadow-[0_12px_40px_-12px_rgba(23,25,29,0.18)]"
    >
      <div className="flex h-10 items-center gap-2 border-b border-line px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e5e7eb]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e5e7eb]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e5e7eb]" />
        <span className="ml-3 text-xs text-muted">quarterly-report.pdf</span>
        <span className="ml-auto h-5 w-16 rounded bg-accent/90" />
      </div>
      <div className="grid h-72 grid-cols-[88px_1fr_168px] sm:h-96">
        <div className="space-y-2 border-r border-line bg-bg p-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`aspect-[3/4] rounded border bg-white ${i === 0 ? 'border-accent' : 'border-line'}`} />
          ))}
        </div>
        <div className="flex items-start justify-center overflow-hidden bg-[#eef0f4] p-5">
          <div className="w-full max-w-[300px] rounded-sm bg-white p-5 shadow-sm">
            <div className="h-2.5 w-2/3 rounded bg-[#d9dce2]" />
            <div className="mt-4 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-[#eceef2]" />
              <div className="relative h-1.5 w-11/12 rounded bg-[#eceef2] ring-2 ring-accent ring-offset-2" />
              <div className="h-1.5 w-full rounded bg-[#eceef2]" />
              <div className="h-1.5 w-4/5 rounded bg-[#eceef2]" />
            </div>
            <div className="mt-4 h-16 rounded bg-[#eceef2]" />
          </div>
        </div>
        <div className="space-y-3 border-l border-line p-3">
          <div className="h-2 w-12 rounded bg-[#d9dce2]" />
          <div className="h-6 rounded border border-line" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-6 rounded border border-line" />
            <div className="h-6 rounded border border-line" />
          </div>
          <div className="h-6 rounded border border-line" />
        </div>
      </div>
    </div>
  )
}
