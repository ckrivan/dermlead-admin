'use client'

import { useState, useEffect, useRef } from 'react'
import { useEvent } from '@/contexts/EventContext'
import { getAttendees } from '@/lib/api/attendees'
import { BADGE_TYPES } from '@/lib/api/attendees'
import { generateBadgePDF, type BadgeAttendee } from '@/lib/badges/generate-pdf'
import { parseAveryFile } from '@/lib/badges/parse-avery'
import { createClient } from '@/lib/supabase/client'
import type { Attendee, BadgeTemplateConfig } from '@/types/database'
import {
  Download,
  Search,
  Square,
  CheckSquare,
  Loader2,
  Upload,
  FileCheck,
  FileSpreadsheet,
  X,
  RotateCcw,
} from 'lucide-react'

type EditableField = 'first_name' | 'last_name' | 'credentials' | 'city' | 'state'

interface EditState {
  id: string
  field: EditableField
}

export default function BadgesPage() {
  const { selectedEvent } = useEvent()
  const selectedEventId = selectedEvent?.id ?? ''

  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [badgeTypeFilter, setBadgeTypeFilter] = useState('')
  const [edits, setEdits] = useState<Record<string, Partial<Attendee>>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<EditState | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)

  const excelInputRef = useRef<HTMLInputElement>(null)

  // Template state
  const [template, setTemplate] = useState<BadgeTemplateConfig | null>(null)
  const [uploading, setUploading] = useState(false)

  // Excel import state
  const [dataSource, setDataSource] = useState<'database' | 'excel'>('database')
  const [excelFilename, setExcelFilename] = useState('')
  const [importingExcel, setImportingExcel] = useState(false)

  // Load attendees and template
  useEffect(() => {
    if (!selectedEventId) {
      setAttendees([])
      setTemplate(null)
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      getAttendees(selectedEventId),
      loadTemplate(),
    ])
      .then(([data]) => {
        setAttendees(data)
        setSelected(new Set(data.map((a) => a.id)))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedEventId])

  async function loadTemplate() {
    if (!selectedEventId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select('badge_template')
      .eq('id', selectedEventId)
      .single()
    if (data?.badge_template) {
      setTemplate(data.badge_template as BadgeTemplateConfig)
    } else {
      setTemplate(null)
    }
  }

  // Auto-focus edit input
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingCell])

  function getFieldValue(attendee: Attendee, field: EditableField): string {
    const editedVal = edits[attendee.id]?.[field]
    if (editedVal !== undefined) return editedVal as string
    return (attendee[field] as string) || ''
  }

  function commitEdit(id: string, field: EditableField, value: string) {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
    setEditingCell(null)
  }

  const filtered = attendees.filter((a) => {
    const name = `${getFieldValue(a, 'first_name')} ${getFieldValue(a, 'last_name')} ${getFieldValue(a, 'credentials')}`.toLowerCase()
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase())
    const matchesType = !badgeTypeFilter || a.badge_type === badgeTypeFilter
    return matchesSearch && matchesType
  })

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((a) => a.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function getSelectedBadgeAttendees(): BadgeAttendee[] {
    return filtered
      .filter((a) => selected.has(a.id))
      .map((a) => ({
        id: a.id,
        first_name: getFieldValue(a, 'first_name'),
        last_name: getFieldValue(a, 'last_name'),
        credentials: getFieldValue(a, 'credentials') || null,
        city: getFieldValue(a, 'city') || null,
        state: getFieldValue(a, 'state') || null,
        badge_type: a.badge_type || 'attendee',
        email: a.email || '',
        phone: a.phone || null,
        institution: a.institution || null,
        specialty: a.specialty || null,
        npi_number: a.npi_number || null,
      }))
  }

  async function handleGeneratePDF() {
    const badgeAttendees = getSelectedBadgeAttendees()
    if (badgeAttendees.length === 0) return

    setGenerating(true)
    setProgress({ current: 0, total: badgeAttendees.length })
    try {
      await generateBadgePDF(
        badgeAttendees,
        (current, total) => setProgress({ current, total }),
        template
      )
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF. Check console for details.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleTemplateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setUploading(true)
    try {
      const { config, logoBlob } = await parseAveryFile(file)
      const supabase = createClient()

      // Upload logo to Supabase Storage if extracted
      let logoUrl: string | null = null
      if (logoBlob) {
        const ext = 'png'
        const path = `${selectedEventId}-badge-logo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(path, logoBlob, { upsert: true, contentType: 'image/png' })

        if (uploadError) {
          console.error('Logo upload failed:', uploadError)
        } else {
          const { data: urlData } = supabase.storage.from('events').getPublicUrl(path)
          logoUrl = urlData.publicUrl
        }
      }

      // Save template config to event
      const fullConfig: BadgeTemplateConfig = {
        ...config,
        logoUrl,
      }

      const { error: updateError } = await supabase
        .from('events')
        .update({ badge_template: fullConfig })
        .eq('id', selectedEventId)

      if (updateError) {
        console.error('Failed to save template:', updateError)
        alert('Failed to save template. Check console.')
      } else {
        setTemplate(fullConfig)
      }
    } catch (err) {
      console.error('Template parsing failed:', err)
      alert('Failed to parse .avery file. Is this a valid Avery Design & Print template?')
    } finally {
      setUploading(false)
      if (templateInputRef.current) templateInputRef.current.value = ''
    }
  }

  async function handleRemoveTemplate() {
    if (!selectedEventId) return
    const supabase = createClient()
    await supabase
      .from('events')
      .update({ badge_template: null })
      .eq('id', selectedEventId)
    setTemplate(null)
  }

  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImportingExcel(true)
    try {
      // Dynamic import to avoid loading xlsx library unless needed
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

      if (rows.length === 0) {
        alert('No data found in Excel file.')
        return
      }

      // Detect column format — collect headers from ALL rows since
      // sheet_to_json omits keys with null/empty values per row
      const headerSet = new Set<string>()
      for (const row of rows) {
        for (const key of Object.keys(row)) headerSet.add(key)
      }
      const headers = Array.from(headerSet)

      // Parse rows into attendee-like objects
      const imported: Attendee[] = rows.map((row, idx) => {
        let firstName = ''
        let lastName = ''
        let credentials = ''
        let city = ''
        let state = ''

        // Format 1: Combined "Preferred Name, Credentials..." column
        const combinedCol = headers.find(h =>
          h.toLowerCase().includes('preferred') || h.toLowerCase().includes('name badge')
        )
        if (combinedCol) {
          const badgeText = (row[combinedCol] || '').trim()
          // Split on first comma to get name vs credentials
          const commaIdx = badgeText.indexOf(',')
          if (commaIdx > -1) {
            const namePart = badgeText.substring(0, commaIdx).trim()
            credentials = badgeText.substring(commaIdx + 1).trim()
            const words = namePart.split(/\s+/)
            firstName = words[0] || ''
            lastName = words.slice(1).join(' ')
          } else {
            // Try to split off known credential suffixes
            const credMatch = badgeText.match(/^(.+?)\s+(PA-[CS]\d?|FNP-?[BC]?|DNP|NP-BC|APRN|DCNP|MD|DO|CEO|Student|PA)$/i)
            if (credMatch) {
              const words = credMatch[1].trim().split(/\s+/)
              firstName = words[0] || ''
              lastName = words.slice(1).join(' ')
              credentials = credMatch[2]
            } else {
              const words = badgeText.split(/\s+/)
              firstName = words[0] || ''
              lastName = words.slice(1).join(' ')
            }
          }
        } else {
          // Format 2: Separate columns
          const fnCol = headers.find(h => h.toLowerCase().includes('first'))
          const lnCol = headers.find(h => h.toLowerCase().includes('last'))
          const credCol = headers.find(h => h.toLowerCase().includes('credential'))
          if (fnCol) firstName = (row[fnCol] || '').trim()
          if (lnCol) lastName = (row[lnCol] || '').trim()
          if (credCol) credentials = (row[credCol] || '').trim()
        }

        const cityCol = headers.find(h => h.toLowerCase().includes('city'))
        const stateCol = headers.find(h => h.toLowerCase().includes('state') || h.toLowerCase().includes('province'))
        if (cityCol) city = (row[cityCol] || '').trim()
        if (stateCol) state = (row[stateCol] || '').trim()

        // Parse additional columns
        const emailCol = headers.find(h => h.toLowerCase().includes('email'))
        const phoneCol = headers.find(h => h.toLowerCase().includes('phone') || h.toLowerCase().includes('mobile'))
        const institutionCol = headers.find(h => h.toLowerCase().includes('institution') || h.toLowerCase().includes('company') || h.toLowerCase().includes('organization') || h.toLowerCase().includes('affiliation') || h.toLowerCase().includes('practice'))
        const specialtyCol = headers.find(h => h.toLowerCase().includes('specialty') || h.toLowerCase().includes('speciality'))
        const npiCol = headers.find(h => h.toLowerCase().includes('npi'))
        const titleCol = headers.find(h => h.toLowerCase().includes('title') || h.toLowerCase().includes('position'))

        const email = emailCol ? String(row[emailCol] ?? '').trim() : ''
        const phone = phoneCol ? String(row[phoneCol] ?? '').trim() : ''
        const institution = institutionCol ? String(row[institutionCol] ?? '').trim() : ''
        const specialty = specialtyCol ? String(row[specialtyCol] ?? '').trim() : ''
        const npi = npiCol ? String(row[npiCol] ?? '').trim() : ''
        const title = titleCol ? String(row[titleCol] ?? '').trim() : ''

        return {
          id: `excel-${idx}`,
          event_id: selectedEventId,
          organization_id: '',
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || null,
          specialty: specialty || null,
          institution: institution || null,
          title: title || null,
          credentials: credentials || null,
          npi_number: npi || null,
          street_address: null,
          street_address_2: null,
          city: city || null,
          state: state || null,
          postal_code: null,
          badge_type: 'attendee',
          badge_generated: false,
          badge_printed: false,
          qr_data: null,
          registered_at: null,
          checked_in: false,
          checked_in_at: null,
          checked_in_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Attendee
      })

      setAttendees(imported)
      setSelected(new Set(imported.map(a => a.id)))
      setEdits({})
      setDataSource('excel')
      setExcelFilename(file.name)
    } catch (err) {
      console.error('Excel import failed:', err)
      alert('Failed to parse Excel file. Please try again.')
      setDataSource('database')
      setExcelFilename('')
    } finally {
      setImportingExcel(false)
      if (excelInputRef.current) excelInputRef.current.value = ''
    }
  }

  function handleRevertToDatabase() {
    if (!selectedEventId) return
    setDataSource('database')
    setExcelFilename('')
    setEdits({})
    setLoading(true)
    getAttendees(selectedEventId)
      .then((data) => {
        setAttendees(data)
        setSelected(new Set(data.map((a) => a.id)))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  function EditableCell({
    attendee,
    field,
    className = '',
  }: {
    attendee: Attendee
    field: EditableField
    className?: string
  }) {
    const value = getFieldValue(attendee, field)
    const isEditing = editingCell?.id === attendee.id && editingCell?.field === field

    if (isEditing) {
      return (
        <input
          ref={editInputRef}
          type="text"
          defaultValue={value}
          className={`w-full bg-transparent border-b-2 border-blue-500 outline-none px-1 py-0.5 text-sm ${className}`}
          onBlur={(e) => commitEdit(attendee.id, field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit(attendee.id, field, (e.target as HTMLInputElement).value)
            if (e.key === 'Escape') setEditingCell(null)
          }}
        />
      )
    }

    const hasEdit = edits[attendee.id]?.[field] !== undefined
    return (
      <span
        className={`cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 text-sm inline-block min-w-[40px] min-h-[24px] ${hasEdit ? 'bg-yellow-50 border-b border-yellow-300' : ''} ${className}`}
        onClick={() => setEditingCell({ id: attendee.id, field })}
        title="Click to edit"
      >
        {value || <span className="text-gray-300 italic">empty</span>}
      </span>
    )
  }

  function badgeColor(type: string): string {
    const colors: Record<string, string> = {
      attendee: 'bg-blue-100 text-blue-800',
      speaker: 'bg-purple-100 text-purple-800',
      industry: 'bg-green-100 text-green-800',
      exhibitor: 'bg-orange-100 text-orange-800',
      sponsor: 'bg-yellow-100 text-yellow-800',
      leader: 'bg-red-100 text-red-800',
      staff: 'bg-gray-100 text-gray-800',
      vip: 'bg-pink-100 text-pink-800',
      press: 'bg-teal-100 text-teal-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (!selectedEventId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Badges</h1>
        <p className="text-gray-500">Select an event to generate badges.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Badges</h1>
        <p className="text-gray-500 text-sm mt-1">
          Edit attendee info and generate Avery 74459 name badge PDFs with QR codes.
        </p>
      </div>

      {/* Template Section */}
      <div className="mb-4 bg-gray-50 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {template ? (
              <>
                <FileCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Template: {template.eventTitle.join(' ')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-block w-4 h-4 rounded border"
                      style={{ backgroundColor: template.barColor }}
                    />
                    <span className="text-xs text-gray-500">
                      Bar: {template.barLabel} &middot; Color: {template.barColor}
                    </span>
                    {template.logoUrl && (
                      <span className="text-xs text-gray-500">&middot; Logo uploaded</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-gray-400" />
                <p className="text-sm text-gray-500">
                  No template uploaded — using default IDF Summit layout.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {template && (
              <button
                onClick={handleRemoveTemplate}
                className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
            <input
              ref={templateInputRef}
              type="file"
              accept=".avery"
              onChange={handleTemplateUpload}
              className="hidden"
            />
            <button
              onClick={() => templateInputRef.current?.click()}
              disabled={uploading}
              className="bg-white border text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {template ? 'Replace Template' : 'Upload .avery Template'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Data Source Indicator + Excel Import */}
      <div className="mb-4 flex items-center gap-3">
        {dataSource === 'excel' ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex-1">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              Data from: {excelFilename}
            </span>
            <span className="text-xs text-green-600">({attendees.length} rows)</span>
            <button
              onClick={handleRevertToDatabase}
              className="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Revert to database
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-1">
            Data from event attendees ({attendees.length})
          </div>
        )}

        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleExcelImport}
          className="hidden"
        />
        <button
          onClick={() => excelInputRef.current?.click()}
          className="bg-white border text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Import Excel
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <select
          value={badgeTypeFilter}
          onChange={(e) => setBadgeTypeFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Badge Types</option>
          {BADGE_TYPES.map((bt) => (
            <option key={bt.value} value={bt.value}>
              {bt.label}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <button
          onClick={toggleAll}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          {selected.size === filtered.length ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
        </button>

        <span className="text-sm text-gray-500">
          {selected.size} of {filtered.length} selected
        </span>

        <button
          onClick={handleGeneratePDF}
          disabled={selected.size === 0 || generating}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating... {progress.current}/{progress.total}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Badge PDF
            </>
          )}
        </button>
      </div>

      {/* Edits indicator */}
      {Object.keys(edits).length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-2 py-1 rounded">
            {Object.keys(edits).length} attendee(s) edited for badge printing
          </span>
          <button
            onClick={() => setEdits({})}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Reset all edits
          </button>
        </div>
      )}

      {/* Table */}
      {loading || importingExcel ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">
            {importingExcel ? 'Parsing Excel file...' : 'Loading attendees...'}
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          {attendees.length === 0
            ? 'No attendees found for this event.'
            : 'No attendees match your filters.'}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                      {selected.size === filtered.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">First Name</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">Last Name</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">Credentials</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">State</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">Badge Type</th>
                  <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((attendee) => (
                  <tr
                    key={attendee.id}
                    className={`hover:bg-gray-50 ${selected.has(attendee.id) ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="px-3 py-2">
                      <button onClick={() => toggleOne(attendee.id)} className="text-gray-400 hover:text-gray-600">
                        {selected.has(attendee.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <EditableCell attendee={attendee} field="first_name" className="font-medium" />
                    </td>
                    <td className="px-3 py-2">
                      <EditableCell attendee={attendee} field="last_name" className="font-medium" />
                    </td>
                    <td className="px-3 py-2">
                      <EditableCell attendee={attendee} field="credentials" />
                    </td>
                    <td className="px-3 py-2">
                      <EditableCell attendee={attendee} field="city" />
                    </td>
                    <td className="px-3 py-2">
                      <EditableCell attendee={attendee} field="state" />
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColor(attendee.badge_type || 'attendee')}`}>
                        {attendee.badge_type || 'attendee'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500 truncate max-w-[200px]">
                      {attendee.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
