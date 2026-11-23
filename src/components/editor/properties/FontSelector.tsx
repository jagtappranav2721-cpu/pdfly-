import { useState, useMemo, useEffect, useRef } from 'react'
import { Check, ChevronDown, Clock, Search } from 'lucide-react'
import {
  FONT_LIBRARY,
  FontCategory,
  FontDefinition,
  addRecentFont,
  ensureFontLoaded,
  getFontDefinition,
  getRecentFonts,
  loadFontResource,
} from '../../../services/fonts/fontLibrary'

interface Props {
  value: string
  onChange: (family: string) => void
}

const CATEGORIES: ('All' | FontCategory)[] = ['All', 'Sans Serif', 'Serif', 'Monospace', 'Display']

export default function FontSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'All' | FontCategory>('All')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeFont = getFontDefinition(value)
  const recentNames = getRecentFonts()

  // Ensure currently selected font is loaded
  useEffect(() => {
    ensureFontLoaded(value)
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Focus search input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filteredFonts = useMemo(() => {
    return FONT_LIBRARY.filter((f) => {
      const matchCat = selectedCategory === 'All' || f.category === selectedCategory
      const matchSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [search, selectedCategory])

  const handleSelect = (font: FontDefinition) => {
    loadFontResource(font)
    addRecentFont(font.name)
    onChange(font.name)
    setOpen(false)
  }

  return (
    <div className="relative w-full" ref={dropdownRef} onMouseDown={(e) => e.stopPropagation()}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center justify-between rounded-md border border-line bg-surface px-2.5 text-xs text-ink transition-colors hover:border-accent focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer"
      >
        <span className="truncate font-medium" style={{ fontFamily: activeFont.css }}>
          {activeFont.name}
        </span>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex max-h-[380px] w-72 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          {/* Search Box */}
          <div className="border-b border-line p-2">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-muted" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search 50+ fonts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-md border border-line bg-toolbar pl-8 pr-3 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-hidden"
              />
            </div>

            {/* Category Pills */}
            <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-accent text-white'
                      : 'bg-toolbar text-muted hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Font List */}
          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-1.5">
            {/* Recently used section if no search active */}
            {!search && selectedCategory === 'All' && recentNames.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <Clock size={11} /> Recently Used
                </div>
                {recentNames.slice(0, 4).map((name) => {
                  const font = getFontDefinition(name)
                  return (
                    <button
                      key={'recent-' + font.id}
                      type="button"
                      onClick={() => handleSelect(font)}
                      onMouseEnter={() => loadFontResource(font)}
                      className={`flex h-8 w-full items-center justify-between rounded-md px-2.5 text-left text-xs transition-colors cursor-pointer ${
                        activeFont.id === font.id
                          ? 'bg-accent-soft text-accent font-semibold'
                          : 'text-ink hover:bg-toolbar'
                      }`}
                    >
                      <span style={{ fontFamily: font.css }}>{font.name}</span>
                      {activeFont.id === font.id && <Check size={14} className="text-accent" />}
                    </button>
                  )
                })}
                <div className="my-1.5 h-px bg-line" />
              </div>
            )}

            {/* All Filtered Fonts */}
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {selectedCategory === 'All' ? 'All Fonts (50+)' : selectedCategory} ({filteredFonts.length})
            </div>

            {filteredFonts.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted">No fonts found matching "{search}"</div>
            ) : (
              filteredFonts.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => handleSelect(font)}
                  onMouseEnter={() => loadFontResource(font)}
                  className={`flex h-8 w-full items-center justify-between rounded-md px-2.5 text-left text-xs transition-colors cursor-pointer ${
                    activeFont.id === font.id
                      ? 'bg-accent-soft text-accent font-semibold'
                      : 'text-ink hover:bg-toolbar'
                  }`}
                >
                  <span className="truncate" style={{ fontFamily: font.css }}>
                    {font.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted">{font.category}</span>
                    {activeFont.id === font.id && <Check size={14} className="text-accent" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
