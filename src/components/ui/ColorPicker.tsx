'use client'

import { useState, useRef, useEffect } from 'react'
import { Pipette } from 'lucide-react'

interface ColorPickerProps {
  label?: string
  value: string
  onChange: (color: string) => void
  presetColors?: string[]
}

const DEFAULT_PRESET_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#ef4444', // red
  '#84cc16', // lime
  '#6366f1', // indigo
  '#14b8a6', // teal
]

export function ColorPicker({
  label,
  value,
  onChange,
  presetColors = DEFAULT_PRESET_COLORS,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customColor, setCustomColor] = useState(value)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCustomColor(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleColorSelect = (color: string) => {
    onChange(color)
    setCustomColor(color)
    setIsOpen(false)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
    onChange(newColor)
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
      )}

      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] hover:border-[var(--input-focus)] focus:outline-none focus:border-[var(--input-focus)] transition-colors"
        >
          <div
            className="w-8 h-8 rounded-md border-2 border-[var(--card-border)]"
            style={{ backgroundColor: value }}
          />
          <span className="flex-1 text-left font-mono text-sm">{value}</span>
          <Pipette size={16} className="text-[var(--foreground-muted)]" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 p-4 w-64 rounded-lg bg-[var(--background-primary)] border border-[var(--card-border)] shadow-lg">
            <div className="space-y-4">
              {/* Preset Colors */}
              <div>
                <p className="text-xs font-medium text-[var(--foreground-muted)] mb-2">
                  Preset Colors
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`w-10 h-10 rounded-md border-2 transition-all hover:scale-110 ${
                        value === color
                          ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30'
                          : 'border-[var(--card-border)]'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Color */}
              <div>
                <p className="text-xs font-medium text-[var(--foreground-muted)] mb-2">
                  Custom Color
                </p>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="w-12 h-10 rounded-md border-2 border-[var(--card-border)] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const newValue = e.target.value
                      setCustomColor(newValue)
                      if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
                        onChange(newValue)
                      }
                    }}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--input-focus)]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
