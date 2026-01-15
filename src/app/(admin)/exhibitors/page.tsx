'use client'

import { useEffect, useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import {
  getExhibitors,
  createExhibitor,
  updateExhibitor,
  deleteExhibitor,
  bulkCreateExhibitors,
  EXHIBITOR_CATEGORIES,
} from '@/lib/api/exhibitors'
import { getEvents } from '@/lib/api/events'
import { getGroups } from '@/lib/api/groups'
import {
  parseCSV,
  generateExhibitorTemplate,
  downloadCSV,
  ExhibitorCSVRow,
} from '@/lib/utils/csv'
import { GroupAssignment } from '@/components/GroupAssignment'
import type { Exhibitor, Event, EventGroup } from '@/types/database'
import {
  Plus,
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Edit,
  Trash2,
  Upload,
  Download,
  X,
  Search,
  Tag,
} from 'lucide-react'

export default function ExhibitorsPage() {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [groups, setGroups] = useState<EventGroup[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingExhibitor, setEditingExhibitor] = useState<Exhibitor | null>(null)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    created: number
    errors: string[]
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    booth_number: '',
    website_url: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    category: '',
  })

  useEffect(() => {
    async function loadEvents() {
      try {
        const eventsData = await getEvents()
        setEvents(eventsData)
        if (eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id)
        }
      } catch (error) {
        console.error('Error loading events:', error)
      }
    }
    loadEvents()
  }, [])

  useEffect(() => {
    async function loadExhibitors() {
      if (!selectedEventId) {
        setExhibitors([])
        setGroups([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [exhibitorsData, groupsData] = await Promise.all([
          getExhibitors(selectedEventId),
          getGroups(selectedEventId),
        ])
        setExhibitors(exhibitorsData)
        setGroups(groupsData)
      } catch (error) {
        console.error('Error loading exhibitors:', error)
      } finally {
        setLoading(false)
      }
    }
    loadExhibitors()
  }, [selectedEventId])

  const filteredExhibitors = exhibitors.filter((exhibitor) => {
    const matchesSearch =
      !searchQuery ||
      exhibitor.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exhibitor.booth_number?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      !selectedCategory || exhibitor.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleOpenForm = (exhibitor?: Exhibitor) => {
    if (exhibitor) {
      setEditingExhibitor(exhibitor)
      setFormData({
        company_name: exhibitor.company_name,
        description: exhibitor.description || '',
        booth_number: exhibitor.booth_number || '',
        website_url: exhibitor.website_url || '',
        contact_name: exhibitor.contact_name || '',
        contact_email: exhibitor.contact_email || '',
        contact_phone: exhibitor.contact_phone || '',
        category: exhibitor.category || '',
      })
    } else {
      setEditingExhibitor(null)
      setFormData({
        company_name: '',
        description: '',
        booth_number: '',
        website_url: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        category: '',
      })
    }
    setShowFormModal(true)
  }

  const handleSave = async () => {
    if (!selectedEventId || !formData.company_name.trim()) return

    setSaving(true)
    try {
      if (editingExhibitor) {
        await updateExhibitor(editingExhibitor.id, {
          company_name: formData.company_name.trim(),
          description: formData.description.trim() || null,
          booth_number: formData.booth_number.trim() || null,
          website_url: formData.website_url.trim() || null,
          contact_name: formData.contact_name.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          category: formData.category || null,
        })
      } else {
        await createExhibitor({
          event_id: selectedEventId,
          company_name: formData.company_name.trim(),
          description: formData.description.trim() || null,
          booth_number: formData.booth_number.trim() || null,
          logo_url: null,
          banner_url: null,
          website_url: formData.website_url.trim() || null,
          contact_name: formData.contact_name.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          category: formData.category || null,
          products_services: null,
          social_links: null,
        })
      }

      const data = await getExhibitors(selectedEventId)
      setExhibitors(data)
      setShowFormModal(false)
    } catch (error) {
      console.error('Error saving exhibitor:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (exhibitor: Exhibitor) => {
    if (!confirm(`Delete "${exhibitor.company_name}"? This cannot be undone.`))
      return

    try {
      await deleteExhibitor(exhibitor.id)
      setExhibitors((prev) => prev.filter((e) => e.id !== exhibitor.id))
    } catch (error) {
      console.error('Error deleting exhibitor:', error)
    }
  }

  const handleDownloadTemplate = () => {
    const template = generateExhibitorTemplate()
    downloadCSV(template, 'exhibitors_template.csv')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const rows = parseCSV<ExhibitorCSVRow>(text)

      if (rows.length === 0) {
        setImportResult({ created: 0, errors: ['No valid rows found in CSV'] })
        return
      }

      const result = await bulkCreateExhibitors(selectedEventId, rows)
      setImportResult(result)

      if (result.created > 0) {
        const data = await getExhibitors(selectedEventId)
        setExhibitors(data)
      }
    } catch (error) {
      console.error('Error importing CSV:', error)
      setImportResult({ created: 0, errors: ['Failed to parse CSV file'] })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <Header title="Exhibitors" subtitle="Manage exhibitors for your events" />

      <div className="p-6 space-y-6">
        {/* Event Selector & Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[var(--foreground-muted)]">
              Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Upload size={18} />}
              onClick={() => setShowImportModal(true)}
              disabled={!selectedEventId}
            >
              Import CSV
            </Button>
            <Button
              icon={<Plus size={18} />}
              onClick={() => handleOpenForm()}
              disabled={!selectedEventId}
            >
              Add Exhibitor
            </Button>
          </div>
        </div>

        {/* Filters */}
        {selectedEventId && exhibitors.length > 0 && (
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Search by name or booth..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
            >
              <option value="">All Categories</option>
              {EXHIBITOR_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Exhibitors List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : !selectedEventId ? (
          <Card>
            <CardBody className="text-center py-12">
              <Building2 size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                Select an Event
              </h3>
              <p className="text-[var(--foreground-muted)]">
                Choose an event to manage its exhibitors.
              </p>
            </CardBody>
          </Card>
        ) : filteredExhibitors.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Building2 size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                {searchQuery || selectedCategory ? 'No exhibitors match your filters' : 'No exhibitors yet'}
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                {searchQuery || selectedCategory
                  ? 'Try adjusting your search or filters.'
                  : 'Add exhibitors to showcase at your event.'}
              </p>
              {!searchQuery && !selectedCategory && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    icon={<Upload size={18} />}
                    onClick={() => setShowImportModal(true)}
                  >
                    Import from CSV
                  </Button>
                  <Button icon={<Plus size={18} />} onClick={() => handleOpenForm()}>
                    Add Exhibitor
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExhibitors.map((exhibitor) => (
              <Card key={exhibitor.id} hover>
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {exhibitor.logo_url ? (
                        <img
                          src={exhibitor.logo_url}
                          alt={exhibitor.company_name}
                          className="w-12 h-12 rounded-lg object-contain bg-[var(--background-secondary)]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[var(--background-tertiary)] flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-[var(--foreground-subtle)]" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">
                          {exhibitor.company_name}
                        </h3>
                        {exhibitor.category && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--background-tertiary)] rounded-full text-[var(--foreground-muted)]">
                            {exhibitor.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenForm(exhibitor)}
                        className="p-1.5 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(exhibitor)}
                        className="p-1.5 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--accent-danger)]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {exhibitor.description && (
                    <p className="text-sm text-[var(--foreground-muted)] mb-3 line-clamp-2">
                      {exhibitor.description}
                    </p>
                  )}

                  <div className="space-y-1 text-sm">
                    {exhibitor.booth_number && (
                      <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                        <MapPin size={14} />
                        <span>Booth {exhibitor.booth_number}</span>
                      </div>
                    )}
                    {exhibitor.website_url && (
                      <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                        <Globe size={14} />
                        <a
                          href={exhibitor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[var(--accent-primary)] truncate"
                        >
                          {exhibitor.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {exhibitor.contact_email && (
                      <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                        <Mail size={14} />
                        <span className="truncate">{exhibitor.contact_email}</span>
                      </div>
                    )}
                    {exhibitor.contact_phone && (
                      <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                        <Phone size={14} />
                        <span>{exhibitor.contact_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Groups */}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[var(--card-border)]">
                    <Tag size={14} className="text-[var(--foreground-muted)] flex-shrink-0" />
                    <GroupAssignment
                      entityType="exhibitor"
                      entityId={exhibitor.id}
                      eventId={selectedEventId}
                      availableGroups={groups}
                      compact={true}
                    />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                {editingExhibitor ? 'Edit Exhibitor' : 'Add Exhibitor'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                  placeholder="Acme Medical Devices"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] resize-none"
                  placeholder="Brief description of the company..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                    Booth Number
                  </label>
                  <input
                    type="text"
                    value={formData.booth_number}
                    onChange={(e) =>
                      setFormData({ ...formData, booth_number: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="A101"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                  >
                    <option value="">Select category</option>
                    {EXHIBITOR_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) =>
                    setFormData({ ...formData, website_url: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                  placeholder="https://example.com"
                />
              </div>

              <div className="border-t border-[var(--card-border)] pt-4">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">
                  Contact Information
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="Contact name"
                  />
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="contact@example.com"
                  />
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="555-123-4567"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
              <Button variant="ghost" onClick={() => setShowFormModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.company_name.trim()}>
                {saving ? 'Saving...' : editingExhibitor ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                Import Exhibitors from CSV
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                }}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                  Upload a CSV file with exhibitor information. Download the template to see the required format.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-[var(--input-border)] rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  {importing ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mb-2" />
                      <span className="text-sm text-[var(--foreground-muted)]">Importing...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload size={32} className="text-[var(--foreground-subtle)] mb-2" />
                      <span className="text-sm text-[var(--foreground)]">Click to select CSV file</span>
                      <span className="text-xs text-[var(--foreground-muted)] mt-1">or drag and drop</span>
                    </div>
                  )}
                </label>
              </div>

              {importResult && (
                <div className={`p-3 rounded-lg ${importResult.errors.length > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {importResult.created} exhibitor{importResult.created !== 1 ? 's' : ''} imported successfully
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">Warnings:</p>
                      <ul className="text-xs text-[var(--accent-warning)] space-y-0.5 max-h-24 overflow-y-auto">
                        {importResult.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>...and {importResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-[var(--card-border)]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
