export default function EditorPreview() {
  return (
    <div
      aria-hidden
      className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-[0_20px_50px_-15px_rgba(15,23,42,0.18)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] transition-all"
    >
      {/* Top Header Mockup */}
      <div className="flex h-11 items-center justify-between border-b border-line bg-toolbar px-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#cbd5e1]" />
          <span className="h-3 w-3 rounded-full bg-[#cbd5e1]" />
          <span className="h-3 w-3 rounded-full bg-[#cbd5e1]" />
          <span className="ml-3 text-xs font-semibold text-ink">Q4_Executive_Brief.pdf</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 rounded-md bg-accent-soft" />
          <div className="h-6 w-20 rounded-md bg-accent" />
        </div>
      </div>

      {/* Editor Body Mockup */}
      <div className="grid h-80 grid-cols-[100px_1fr_190px] sm:h-[420px]">
        {/* Left Sidebar Mockup */}
        <div className="space-y-3 border-r border-line bg-surface p-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`aspect-[3/4] rounded-md border p-1 shadow-2xs transition-colors ${
                i === 0 ? 'border-accent bg-accent-soft/30 ring-1 ring-accent' : 'border-line bg-white'
              }`}
            >
              <div className="h-2 w-1/2 rounded bg-[#e2e8f0]" />
              <div className="mt-2 space-y-1">
                <div className="h-1 w-full rounded bg-[#f1f5f9]" />
                <div className="h-1 w-4/5 rounded bg-[#f1f5f9]" />
              </div>
            </div>
          ))}
        </div>

        {/* Center Workspace Canvas */}
        <div className="flex items-center justify-center overflow-hidden bg-bg p-6">
          <div className="w-full max-w-[340px] rounded-lg border border-[#cbd5e1]/40 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-1/2 rounded bg-[#0f172a]" />
              <div className="h-3 w-12 rounded bg-[#2563eb]" />
            </div>

            <div className="mt-5 space-y-2">
              <div className="h-2 w-full rounded bg-[#e2e8f0]" />
              {/* Highlighted & Active Edit Line */}
              <div className="relative rounded-sm bg-accent-soft px-1.5 py-1 ring-1 ring-accent">
                <div className="h-2 w-3/4 rounded bg-accent" />
              </div>
              <div className="h-2 w-full rounded bg-[#e2e8f0]" />
              <div className="h-2 w-5/6 rounded bg-[#e2e8f0]" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="h-16 rounded-md bg-[#f8fafc] border border-line" />
              <div className="h-16 rounded-md bg-[#eff6ff] border border-accent/20" />
            </div>
          </div>
        </div>

        {/* Right Properties Panel Mockup */}
        <div className="space-y-3.5 border-l border-line bg-surface p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Typography</div>
          <div className="flex h-7 items-center justify-between rounded-md border border-line bg-toolbar px-2 text-xs text-ink font-medium">
            <span>Montserrat</span>
            <span className="text-[10px] text-accent font-semibold">50+</span>
          </div>

          <div className="flex gap-1.5">
            <div className="flex h-7 flex-1 items-center justify-center rounded-md border border-line text-xs font-bold text-accent bg-accent-soft">
              B
            </div>
            <div className="flex h-7 flex-1 items-center justify-center rounded-md border border-line text-xs italic text-ink">
              I
            </div>
            <div className="flex h-7 flex-1 items-center justify-center rounded-md border border-line text-xs underline text-ink">
              U
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-line">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Detected Font</div>
            <div className="rounded-lg bg-toolbar p-2 text-[11px] text-muted leading-tight">
              <span className="font-medium text-ink">Calibri-Bold</span>
              <div className="text-accent mt-0.5">Matched to Arial</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
