'use client'

import { useEffect, useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import {
  getSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  bulkCreateSponsors,
  SPONSOR_TIERS,
} from '@/lib/api/sponsors'
import { getEvents } from '@/lib/api/events'
import { getGroups } from '@/lib/api/groups'
import {
  parseCSV,
  generateSponsorTemplate,
  downloadCSV,
  SponsorCSVRow,
} from '@/lib/utils/csv'
import { GroupAssignment } from '@/components/GroupAssignment'
import type { Sponsor, Event, EventGroup } from '@/types/database'
import {
  Plus,
  Award,
  MapPin,
  Globe,
  Mail,
  Edit,
  Trash2,
  Upload,
  Download,
  X,
  Star,
  Tag,
} from 'lucide-react'

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [groups, setGroups] = useState<EventGroup[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<string>('')

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
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
    tier: 'partner' as Sponsor['tier'],
    website_url: '',
    contact_name: '',
    contact_email: '',
    booth_number: '',
    is_featured: false,
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
    async function loadSponsors() {
      if (!selectedEventId) {
        setSponsors([])
        setGroups([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [sponsorsData, groupsData] = await Promise.all([
          getSponsors(selectedEventId),
          getGroups(selectedEventId),
        ])
        setSponsors(sponsorsData)
        setGroups(groupsData)
      } catch (error) {
        console.error('Error loading sponsors:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSponsors()
  }, [selectedEventId])

  const filteredSponsors = sponsors.filter((sponsor) => {
    return !selectedTier || sponsor.tier === selectedTier
  })

  // Group sponsors by tier for display
  const sponsorsByTier = SPONSOR_TIERS.reduce(
    (acc, tier) => {
      acc[tier.value] = filteredSponsors.filter((s) => s.tier === tier.value)
      return acc
    },
    {} as Record<string, Sponsor[]>
  )

  const handleOpenForm = (sponsor?: Sponsor) => {
    if (sponsor) {
      setEditingSponsor(sponsor)
      setFormData({
        company_name: sponsor.company_name,
        description: sponsor.description || '',
        tier: sponsor.tier,
        website_url: sponsor.website_url || '',
        contact_name: sponsor.contact_name || '',
        contact_email: sponsor.contact_email || '',
        booth_number: sponsor.booth_number || '',
        is_featured: sponsor.is_featured,
      })
    } else {
      setEditingSponsor(null)
      setFormData({
        company_name: '',
        description: '',
        tier: 'partner',
        website_url: '',
        contact_name: '',
        contact_email: '',
        booth_number: '',
        is_featured: false,
      })
    }
    setShowFormModal(true)
  }

  const handleSave = async () => {
    if (!selectedEventId || !formData.company_name.trim()) return

    setSaving(true)
    try {
      if (editingSponsor) {
        await updateSponsor(editingSponsor.id, {
          company_name: formData.company_name.trim(),
          description: formData.description.trim() || null,
          tier: formData.tier,
          website_url: formData.website_url.trim() || null,
          contact_name: formData.contact_name.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          booth_number: formData.booth_number.trim() || null,
          is_featured: formData.is_featured,
        })
      } else {
        await createSponsor({
          event_id: selectedEventId,
          company_name: formData.company_name.trim(),
          description: formData.description.trim() || null,
          tier: formData.tier,
          logo_url: null,
          banner_url: null,
          website_url: formData.website_url.trim() || null,
          contact_name: formData.contact_name.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          booth_number: formData.booth_number.trim() || null,
          display_order: 0,
          is_featured: formData.is_featured,
          social_links: null,
        })
      }

      const data = await getSponsors(selectedEventId)
      setSponsors(data)
      setShowFormModal(false)
    } catch (error) {
      console.error('Error saving sponsor:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sponsor: Sponsor) => {
    if (!confirm(`Delete "${sponsor.company_name}"? This cannot be undone.`))
      return

    try {
      await deleteSponsor(sponsor.id)
      setSponsors((prev) => prev.filter((s) => s.id !== sponsor.id))
    } catch (error) {
      console.error('Error deleting sponsor:', error)
    }
  }

  const handleDownloadTemplate = () => {
    const template = generateSponsorTemplate()
    downloadCSV(template, 'sponsors_template.csv')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const rows = parseCSV<SponsorCSVRow>(text)

      if (rows.length === 0) {
        setImportResult({ created: 0, errors: ['No valid rows found in CSV'] })
        return
      }

      const result = await bulkCreateSponsors(selectedEventId, rows)
      setImportResult(result)

      if (result.created > 0) {
        const data = await getSponsors(selectedEventId)
        setSponsors(data)
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

  const getTierInfo = (tier: string) => {
    return SPONSOR_TIERS.find((t) => t.value === tier) || SPONSOR_TIERS[4]
  }

  return (
    <>
      <Header title="Sponsors" subtitle="Manage sponsors for your events" />

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
              Add Sponsor
            </Button>
          </div>
        </div>

        {/* Tier Filter */}
        {selectedEventId && sponsors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTier('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedTier
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]'
              }`}
            >
              All Tiers
            </button>
            {SPONSOR_TIERS.map((tier) => (
              <button
                key={tier.value}
                onClick={() => setSelectedTier(tier.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedTier === tier.value
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                {tier.label}
              </button>
            ))}
          </div>
        )}

        {/* Sponsors List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : !selectedEventId ? (
          <Card>
            <CardBody className="text-center py-12">
              <Award size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                Select an Event
              </h3>
              <p className="text-[var(--foreground-muted)]">
                Choose an event to manage its sponsors.
              </p>
            </CardBody>
          </Card>
        ) : filteredSponsors.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Award size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                {selectedTier ? 'No sponsors in this tier' : 'No sponsors yet'}
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                {selectedTier
                  ? 'Try selecting a different tier.'
                  : 'Add sponsors to support your event.'}
              </p>
              {!selectedTier && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    icon={<Upload size={18} />}
                    onClick={() => setShowImportModal(true)}
                  >
                    Import from CSV
                  </Button>
                  <Button icon={<Plus size={18} />} onClick={() => handleOpenForm()}>
                    Add Sponsor
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ) : selectedTier ? (
          // Flat list when filtered by tier
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSponsors.map((sponsor) => (
              <SponsorCard
                key={sponsor.id}
                sponsor={sponsor}
                tierInfo={getTierInfo(sponsor.tier)}
                groups={groups}
                eventId={selectedEventId}
                onEdit={() => handleOpenForm(sponsor)}
                onDelete={() => handleDelete(sponsor)}
              />
            ))}
          </div>
        ) : (
          // Grouped by tier
          <div className="space-y-8">
            {SPONSOR_TIERS.map((tier) => {
              const tieredSponsors = sponsorsByTier[tier.value]
              if (tieredSponsors.length === 0) return null

              return (
                <div key={tier.value}>
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                      {tier.label} Sponsors
                    </h2>
                    <span className="text-sm text-[var(--foreground-muted)]">
                      ({tieredSponsors.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tieredSponsors.map((sponsor) => (
                      <SponsorCard
                        key={sponsor.id}
                        sponsor={sponsor}
                        tierInfo={tier}
                        groups={groups}
                        eventId={selectedEventId}
                        onEdit={() => handleOpenForm(sponsor)}
                        onDelete={() => handleDelete(sponsor)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                {editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}
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
                  placeholder="Pfizer Dermatology"
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
                  placeholder="Brief description of the sponsor..."
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                  Sponsor Tier *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SPONSOR_TIERS.map((tier) => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, tier: tier.value as Sponsor['tier'] })
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                        formData.tier === tier.value
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : 'border-[var(--card-border)] hover:border-[var(--accent-primary)]/50'
                      }`}
                    >
                      <span
                        className="block w-4 h-4 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: tier.color }}
                      />
                      <span className="text-xs text-[var(--foreground)]">{tier.label}</span>
                    </button>
                  ))}
                </div>
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
                    placeholder="Main Hall"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) =>
                        setFormData({ ...formData, is_featured: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-[var(--input-border)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    <span className="text-sm text-[var(--foreground)] flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" />
                      Featured Sponsor
                    </span>
                  </label>
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
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
              <Button variant="ghost" onClick={() => setShowFormModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.company_name.trim()}>
                {saving ? 'Saving...' : editingSponsor ? 'Update' : 'Create'}
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
                Import Sponsors from CSV
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
                  Upload a CSV file with sponsor information. Download the template to see the required format.
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
                    {importResult.created} sponsor{importResult.created !== 1 ? 's' : ''} imported successfully
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

// Sponsor Card Component
function SponsorCard({
  sponsor,
  tierInfo,
  groups,
  eventId,
  onEdit,
  onDelete,
}: {
  sponsor: Sponsor
  tierInfo: { value: string; label: string; color: string }
  groups: EventGroup[]
  eventId: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card hover>
      <CardBody>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {sponsor.logo_url ? (
              <img
                src={sponsor.logo_url}
                alt={sponsor.company_name}
                className="w-12 h-12 rounded-lg object-contain bg-[var(--background-secondary)]"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[var(--background-tertiary)] flex items-center justify-center">
                <Award className="h-6 w-6 text-[var(--foreground-subtle)]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--foreground)]">
                  {sponsor.company_name}
                </h3>
                {sponsor.is_featured && (
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tierInfo.color }}
                />
                <span className="text-xs text-[var(--foreground-muted)]">
                  {tierInfo.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--accent-danger)]"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {sponsor.description && (
          <p className="text-sm text-[var(--foreground-muted)] mb-3 line-clamp-2">
            {sponsor.description}
          </p>
        )}

        <div className="space-y-1 text-sm">
          {sponsor.booth_number && (
            <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
              <MapPin size={14} />
              <span>{sponsor.booth_number}</span>
            </div>
          )}
          {sponsor.website_url && (
            <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
              <Globe size={14} />
              <a
                href={sponsor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--accent-primary)] truncate"
              >
                {sponsor.website_url.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {sponsor.contact_email && (
            <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
              <Mail size={14} />
              <span className="truncate">{sponsor.contact_email}</span>
            </div>
          )}
        </div>

        {/* Groups */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[var(--card-border)]">
          <Tag size={14} className="text-[var(--foreground-muted)] flex-shrink-0" />
          <GroupAssignment
            entityType="sponsor"
            entityId={sponsor.id}
            eventId={eventId}
            availableGroups={groups}
            compact={true}
          />
        </div>
      </CardBody>
    </Card>
  )
}
