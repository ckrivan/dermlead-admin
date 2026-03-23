'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getLeads, deleteLead, bulkDeleteLeads } from '@/lib/api/leads'
import { useEvent } from '@/contexts/EventContext'
import type { Lead } from '@/types/database'
import {
  Search,
  Trash2,
  Star,
  CheckSquare,
  Square,
  Download,
  Filter,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

const CAPTURE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'exhibit', label: 'Exhibit' },
  { value: 'product_theater', label: 'Product Theater' },
]

export default function LeadsPage() {
  const { selectedEvent } = useEvent()
  const selectedEventId = selectedEvent?.id ?? ''

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [captureTypeFilter, setCaptureTypeFilter] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!selectedEventId) {
      setLoading(false)
      return
    }
    loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId])

  async function loadLeads() {
    try {
      setLoading(true)
      setError(null)
      const data = await getLeads(selectedEventId)
      setLeads(data)
    } catch (err) {
      console.error('Error loading leads:', err)
      setError('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const searchable = [
        lead.first_name,
        lead.last_name,
        lead.work_email,
        lead.specialty,
        lead.institution,
        lead.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!searchable.includes(q)) return false
    }
    // Capture type filter
    if (captureTypeFilter && lead.capture_type !== captureTypeFilter) return false
    return true
  })

  async function handleDelete(id: string) {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    try {
      setDeleting(true)
      await deleteLead(id)
      setLeads((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      console.error('Error deleting lead:', err)
      alert('Failed to delete lead')
    } finally {
      setDeleting(false)
    }
  }

  async function handleBulkDelete() {
    const count = selectedLeads.size
    if (!confirm(`Delete ${count} selected lead${count > 1 ? 's' : ''}? This cannot be undone.`))
      return
    try {
      setDeleting(true)
      await bulkDeleteLeads(Array.from(selectedLeads))
      setLeads((prev) => prev.filter((l) => !selectedLeads.has(l.id)))
      setSelectedLeads(new Set())
      setSelectMode(false)
    } catch (err) {
      console.error('Error bulk deleting:', err)
      alert('Failed to delete leads')
    } finally {
      setDeleting(false)
    }
  }

  function toggleSelect(id: string) {
    setSelectedLeads((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)))
    }
  }

  function exportCSV() {
    // Pfizer industry standard format
    const headers = [
      'First Name',
      'Last Name',
      'Specialty',
      'Credentials',
      'Business Address',
      'City',
      'State',
      'Zipcode',
      'NPI',
      'Email',
      'Phone',
    ]
    const rows = filteredLeads.map((l) => {
      // Include email/phone only if attendee opted in (contact_shared)
      const showContact = l.contact_shared !== false
      return [
        l.first_name,
        l.last_name,
        l.specialty || '',
        l.credentials || '',
        l.institution || '',
        l.city || '',
        l.state || '',
        '', // Zipcode - not stored on leads
        l.npi_number || '',
        showContact ? l.work_email : '',
        showContact ? (l.phone || '') : '',
      ]
    })
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${selectedEvent?.name || 'export'}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function renderStars(score: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={s <= score ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
          />
        ))}
      </div>
    )
  }

  if (!selectedEventId) {
    return (
      <>
        <Header title="Leads" />
        <div className="p-4 md:p-6">
          <Card>
            <CardBody>
              <p className="text-gray-500 text-center py-8">
                Select an event to view leads
              </p>
            </CardBody>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Leads" />
      <div className="p-4 md:p-6 space-y-4">
        {/* Stats bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
              {searchQuery || captureTypeFilter ? ` (${leads.length} total)` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectMode && selectedLeads.size > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                <Trash2 size={14} className="mr-1" />
                Delete {selectedLeads.size}
              </Button>
            )}
            <Button
              variant={selectMode ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setSelectMode(!selectMode)
                setSelectedLeads(new Set())
              }}
            >
              <CheckSquare size={14} className="mr-1" />
              {selectMode ? 'Done' : 'Select'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCSV}
              disabled={filteredLeads.length === 0}
            >
              <Download size={14} className="mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={captureTypeFilter}
              onChange={(e) => setCaptureTypeFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              {CAPTURE_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}{' '}
            <button onClick={loadLeads} className="underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <Card>
            <CardBody>
              <p className="text-gray-500 text-center py-8">Loading leads...</p>
            </CardBody>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-gray-500 text-center py-8">
                {searchQuery || captureTypeFilter
                  ? 'No leads match your filters'
                  : 'No leads captured yet'}
              </p>
            </CardBody>
          </Card>
        ) : (
          /* Table */
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {selectMode && (
                      <th className="px-4 py-3 text-left">
                        <button onClick={toggleSelectAll}>
                          {selectedLeads.size === filteredLeads.length ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : (
                            <Square size={16} className="text-gray-400" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Specialty</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Institution</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Score</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Captured</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      {selectMode && (
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(lead.id)}>
                            {selectedLeads.has(lead.id) ? (
                              <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                              <Square size={16} className="text-gray-400" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">
                        {lead.first_name} {lead.last_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.work_email}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.specialty}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.institution || '—'}</td>
                      <td className="px-4 py-3">{renderStars(lead.lead_score)}</td>
                      <td className="px-4 py-3">
                        {lead.capture_type ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              lead.capture_type === 'product_theater'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {lead.capture_type === 'product_theater' ? 'Product Theater' : 'Exhibit'}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {format(parseISO(lead.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(lead.id)}
                          disabled={deleting}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete lead"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
