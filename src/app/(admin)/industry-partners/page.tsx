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
  uploadExhibitorLogo,
  uploadExhibitorDocument,
  deleteExhibitorDocument,
  EXHIBITOR_CATEGORIES,
} from '@/lib/api/exhibitors'
import {
  getSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  bulkCreateSponsors,
  uploadSponsorLogo,
  uploadSponsorDocument,
  deleteSponsorDocument,
  SPONSOR_TIERS,
} from '@/lib/api/sponsors'
import { getEvents } from '@/lib/api/events'
import { getGroups } from '@/lib/api/groups'
import {
  parseCSV,
  generateExhibitorTemplate,
  generateSponsorTemplate,
  downloadCSV,
  ExhibitorCSVRow,
  SponsorCSVRow,
  parseExcelFile,
  mapExcelRowToAttendee,
  isExcelFile,
} from '@/lib/utils/csv'
import {
  bulkCreateAttendees,
  type AttendeeCSVRow,
} from '@/lib/api/attendees'
import { GroupAssignment } from '@/components/GroupAssignment'
import { createClient } from '@/lib/supabase/client'
import type { Attendee, Exhibitor, Sponsor, Event, EventGroup } from '@/types/database'
import { isAbortError } from '@/contexts/EventContext'
import {
  Plus,
  Building2,
  Award,
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
  Star,
  FileText,
  Users,
} from 'lucide-react'

type ActiveTab = 'exhibitors' | 'sponsors'

export default function IndustryPartnersPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('exhibitors')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [groups, setGroups] = useState<EventGroup[]>([])
  const [loading, setLoading] = useState(true)

  // Exhibitor state
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Sponsor state
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [selectedTier, setSelectedTier] = useState<string>('')

  // Exhibitor modal state
  const [showExhibitorForm, setShowExhibitorForm] = useState(false)
  const [editingExhibitor, setEditingExhibitor] = useState<Exhibitor | null>(null)
  const [exhibitorFormData, setExhibitorFormData] = useState({
    company_name: '',
    description: '',
    booth_number: '',
    website_url: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    category: '',
    leads_enabled: false,
  })

  // Sponsor modal state
  const [showSponsorForm, setShowSponsorForm] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [sponsorFormData, setSponsorFormData] = useState({
    company_name: '',
    description: '',
    tier: 'exhibitor' as Sponsor['tier'],
    website_url: '',
    contact_name: '',
    contact_email: '',
    booth_number: '',
    is_featured: false,
    leads_enabled: false,
  })

  // Shared modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    created: number
    errors: string[]
  } | null>(null)

  // People import state (attendees with badge_type='industry')
  const [showPeopleImportModal, setShowPeopleImportModal] = useState(false)
  const [importingPeople, setImportingPeople] = useState(false)
  const [peopleImportResult, setPeopleImportResult] = useState<{
    created: number
    errors: string[]
  } | null>(null)
  const peopleFileInputRef = useRef<HTMLInputElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Document state
  const docInputRef = useRef<HTMLInputElement>(null)
  const [pendingDocs, setPendingDocs] = useState<{ title: string; url: string }[]>([])
  const [docTitle, setDocTitle] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // Leads access modal state
  const [leadsModalCompany, setLeadsModalCompany] = useState<string | null>(null)
  const [leadsModalStaff, setLeadsModalStaff] = useState<Attendee[]>([])
  const [leadsModalLoading, setLeadsModalLoading] = useState(false)

  // Load events
  useEffect(() => {
    let cancelled = false
    async function loadEvents() {
      try {
        const eventsData = await getEvents()
        if (cancelled) return
        setEvents(eventsData)
        if (eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id)
        }
      } catch (err: unknown) {
        if (cancelled) return
        if (isAbortError(err)) return
        console.error('Error loading events:', err)
      }
    }
    loadEvents()
    return () => { cancelled = true }
  }, [])

  // Load data when event changes
  useEffect(() => {
    async function loadData() {
      if (!selectedEventId) {
        setExhibitors([])
        setSponsors([])
        setGroups([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [exhibitorsData, sponsorsData, groupsData] = await Promise.all([
          getExhibitors(selectedEventId),
          getSponsors(selectedEventId),
          getGroups(selectedEventId),
        ])
        setExhibitors(exhibitorsData)
        setSponsors(sponsorsData)
        setGroups(groupsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedEventId])

  // --- Exhibitor handlers ---
  const filteredExhibitors = exhibitors.filter((exhibitor) => {
    const matchesSearch =
      !searchQuery ||
      exhibitor.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exhibitor.booth_number?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      !selectedCategory || exhibitor.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleOpenExhibitorForm = (exhibitor?: Exhibitor) => {
    if (exhibitor) {
      setEditingExhibitor(exhibitor)
      setExhibitorFormData({
        company_name: exhibitor.company_name,
        description: exhibitor.description || '',
        booth_number: exhibitor.booth_number || '',
        website_url: exhibitor.website_url || '',
        contact_name: exhibitor.contact_name || '',
        contact_email: exhibitor.contact_email || '',
        contact_phone: exhibitor.contact_phone || '',
        category: exhibitor.category || '',
        leads_enabled: exhibitor.leads_enabled,
      })
      setLogoPreview(exhibitor.logo_url)
      setPendingDocs(exhibitor.documents || [])
    } else {
      setEditingExhibitor(null)
      setExhibitorFormData({
        company_name: '',
        description: '',
        booth_number: '',
        website_url: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        category: '',
        leads_enabled: false,
      })
      setLogoPreview(null)
      setPendingDocs([])
    }
    setDocTitle('')
    setShowExhibitorForm(true)
  }

  const handleSaveExhibitor = async () => {
    if (!selectedEventId || !exhibitorFormData.company_name.trim()) return
    setSaving(true)
    try {
      if (editingExhibitor) {
        await updateExhibitor(editingExhibitor.id, {
          company_name: exhibitorFormData.company_name.trim(),
          description: exhibitorFormData.description.trim() || null,
          booth_number: exhibitorFormData.booth_number.trim() || null,
          website_url: exhibitorFormData.website_url.trim() || null,
          contact_name: exhibitorFormData.contact_name.trim() || null,
          contact_email: exhibitorFormData.contact_email.trim() || null,
          contact_phone: exhibitorFormData.contact_phone.trim() || null,
          category: exhibitorFormData.category || null,
          leads_enabled: exhibitorFormData.leads_enabled,
          documents: pendingDocs.length > 0 ? pendingDocs : null,
        })
      } else {
        await createExhibitor({
          event_id: selectedEventId,
          company_name: exhibitorFormData.company_name.trim(),
          description: exhibitorFormData.description.trim() || null,
          booth_number: exhibitorFormData.booth_number.trim() || null,
          logo_url: null,
          banner_url: null,
          website_url: exhibitorFormData.website_url.trim() || null,
          contact_name: exhibitorFormData.contact_name.trim() || null,
          contact_email: exhibitorFormData.contact_email.trim() || null,
          contact_phone: exhibitorFormData.contact_phone.trim() || null,
          category: exhibitorFormData.category || null,
          products_services: null,
          social_links: null,
          leads_enabled: exhibitorFormData.leads_enabled,
          documents: pendingDocs.length > 0 ? pendingDocs : null,
        })
      }
      const data = await getExhibitors(selectedEventId)
      setExhibitors(data)
      setShowExhibitorForm(false)
    } catch (error) {
      console.error('Error saving exhibitor:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExhibitor = async (exhibitor: Exhibitor) => {
    if (!confirm(`Delete "${exhibitor.company_name}"? This cannot be undone.`)) return
    try {
      await deleteExhibitor(exhibitor.id)
      setExhibitors((prev) => prev.filter((e) => e.id !== exhibitor.id))
    } catch (error) {
      console.error('Error deleting exhibitor:', error)
    }
  }

  // --- Sponsor handlers ---
  const filteredSponsors = sponsors.filter((sponsor) => {
    return !selectedTier || sponsor.tier === selectedTier
  })

  const sponsorsByTier = SPONSOR_TIERS.reduce(
    (acc, tier) => {
      acc[tier.value] = filteredSponsors.filter((s) => s.tier === tier.value)
      return acc
    },
    {} as Record<string, Sponsor[]>
  )

  const handleOpenSponsorForm = (sponsor?: Sponsor) => {
    if (sponsor) {
      setEditingSponsor(sponsor)
      setSponsorFormData({
        company_name: sponsor.company_name,
        description: sponsor.description || '',
        tier: sponsor.tier,
        website_url: sponsor.website_url || '',
        contact_name: sponsor.contact_name || '',
        contact_email: sponsor.contact_email || '',
        booth_number: sponsor.booth_number || '',
        is_featured: sponsor.is_featured,
        leads_enabled: sponsor.leads_enabled,
      })
      setLogoPreview(sponsor.logo_url)
      setPendingDocs(sponsor.documents || [])
    } else {
      setEditingSponsor(null)
      setSponsorFormData({
        company_name: '',
        description: '',
        tier: 'exhibitor',
        website_url: '',
        contact_name: '',
        contact_email: '',
        booth_number: '',
        is_featured: false,
        leads_enabled: false,
      })
      setLogoPreview(null)
      setPendingDocs([])
    }
    setDocTitle('')
    setShowSponsorForm(true)
  }

  const handleSaveSponsor = async () => {
    if (!selectedEventId || !sponsorFormData.company_name.trim()) return
    setSaving(true)
    try {
      if (editingSponsor) {
        await updateSponsor(editingSponsor.id, {
          company_name: sponsorFormData.company_name.trim(),
          description: sponsorFormData.description.trim() || null,
          tier: sponsorFormData.tier,
          website_url: sponsorFormData.website_url.trim() || null,
          contact_name: sponsorFormData.contact_name.trim() || null,
          contact_email: sponsorFormData.contact_email.trim() || null,
          booth_number: sponsorFormData.booth_number.trim() || null,
          is_featured: sponsorFormData.is_featured,
          leads_enabled: sponsorFormData.leads_enabled,
          documents: pendingDocs.length > 0 ? pendingDocs : null,
        })
      } else {
        await createSponsor({
          event_id: selectedEventId,
          company_name: sponsorFormData.company_name.trim(),
          description: sponsorFormData.description.trim() || null,
          tier: sponsorFormData.tier,
          logo_url: null,
          banner_url: null,
          website_url: sponsorFormData.website_url.trim() || null,
          contact_name: sponsorFormData.contact_name.trim() || null,
          contact_email: sponsorFormData.contact_email.trim() || null,
          booth_number: sponsorFormData.booth_number.trim() || null,
          display_order: 0,
          is_featured: sponsorFormData.is_featured,
          leads_enabled: sponsorFormData.leads_enabled,
          social_links: null,
          documents: pendingDocs.length > 0 ? pendingDocs : null,
        })
      }
      const data = await getSponsors(selectedEventId)
      setSponsors(data)
      setShowSponsorForm(false)
    } catch (error) {
      console.error('Error saving sponsor:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSponsor = async (sponsor: Sponsor) => {
    if (!confirm(`Delete "${sponsor.company_name}"? This cannot be undone.`)) return
    try {
      await deleteSponsor(sponsor.id)
      setSponsors((prev) => prev.filter((s) => s.id !== sponsor.id))
    } catch (error) {
      console.error('Error deleting sponsor:', error)
    }
  }

  const handleToggleSponsorLeads = async (sponsor: Sponsor) => {
    try {
      await updateSponsor(sponsor.id, { leads_enabled: !sponsor.leads_enabled })
      setSponsors((prev) => prev.map((s) => s.id === sponsor.id ? { ...s, leads_enabled: !s.leads_enabled } : s))
    } catch (error) {
      console.error('Error toggling sponsor leads:', error)
    }
  }

  const handleToggleExhibitorLeads = async (exhibitor: Exhibitor) => {
    try {
      await updateExhibitor(exhibitor.id, { leads_enabled: !exhibitor.leads_enabled })
      setExhibitors((prev) => prev.map((e) => e.id === exhibitor.id ? { ...e, leads_enabled: !e.leads_enabled } : e))
    } catch (error) {
      console.error('Error toggling exhibitor leads:', error)
    }
  }

  const openLeadsModal = async (companyName: string) => {
    setLeadsModalCompany(companyName)
    setLeadsModalLoading(true)
    setLeadsModalStaff([])
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('attendees')
        .select('*')
        .eq('event_id', selectedEventId)
        .ilike('institution', companyName)
        .order('last_name')
      setLeadsModalStaff((data as Attendee[]) || [])
    } catch (error) {
      console.error('Error fetching company staff:', error)
    } finally {
      setLeadsModalLoading(false)
    }
  }

  const handleToggleAttendeeLeads = async (attendeeId: string, currentValue: boolean) => {
    const newValue = !currentValue
    try {
      const res = await fetch('/api/attendees/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, leadsAccess: newValue }),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error('Error toggling leads access:', err)
        return
      }
      setLeadsModalStaff((prev) =>
        prev.map((a) => a.id === attendeeId ? { ...a, leads_access: newValue } : a)
      )
    } catch (error) {
      console.error('Error toggling attendee leads:', error)
    }
  }

  const getTierInfo = (tier: string) => {
    return SPONSOR_TIERS.find((t) => t.value === tier) || SPONSOR_TIERS[SPONSOR_TIERS.length - 1]
  }

  // --- People (attendees) import handler for industry partner Excel ---
  const handlePeopleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setImportingPeople(true)
    setPeopleImportResult(null)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rows: any[]

      if (isExcelFile(file.name)) {
        const rawRows = await parseExcelFile(file)
        if (rawRows.length === 0) {
          setPeopleImportResult({ created: 0, errors: ['No data found in file'] })
          return
        }
        const headers = Object.keys(rawRows[0])
        for (const row of rawRows) {
          for (const key of Object.keys(row)) {
            if (!headers.includes(key)) headers.push(key)
          }
        }
        rows = rawRows.map((row) => mapExcelRowToAttendee(headers, row, 'industry'))
      } else {
        const text = await file.text()
        const parsed = parseCSV<Record<string, string>>(text)
        // Set badge_type to industry for CSV imports too
        rows = parsed.map((row) => ({ ...row, badge_type: row.badge_type || 'industry' }))
      }

      if (rows.length === 0) {
        setPeopleImportResult({ created: 0, errors: ['No valid rows found in file'] })
        return
      }

      const result = await bulkCreateAttendees(selectedEventId, rows, groups)
      setPeopleImportResult(result)
    } catch (error) {
      console.error('Error importing people file:', error)
      setPeopleImportResult({ created: 0, errors: ['Failed to parse file'] })
    } finally {
      setImportingPeople(false)
      if (peopleFileInputRef.current) {
        peopleFileInputRef.current.value = ''
      }
    }
  }

  // --- Import handlers ---
  const handleDownloadTemplate = () => {
    if (activeTab === 'exhibitors') {
      const template = generateExhibitorTemplate()
      downloadCSV(template, 'exhibitors_template.csv')
    } else {
      const template = generateSponsorTemplate()
      downloadCSV(template, 'sponsors_template.csv')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()

      if (activeTab === 'exhibitors') {
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
      } else {
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
      <Header title="Industry Partners" subtitle="Manage exhibitors and sponsors for your events" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Event Selector & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[var(--foreground-muted)]">Event:</label>
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
              icon={<Users size={18} />}
              onClick={() => setShowPeopleImportModal(true)}
              disabled={!selectedEventId}
            >
              Import People
            </Button>
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
              onClick={() =>
                activeTab === 'exhibitors'
                  ? handleOpenExhibitorForm()
                  : handleOpenSponsorForm()
              }
              disabled={!selectedEventId}
            >
              Add {activeTab === 'exhibitors' ? 'Exhibitor' : 'Sponsor'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--card-border)]">
          <button
            onClick={() => setActiveTab('exhibitors')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'exhibitors'
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground-muted)]'
            }`}
          >
            <Building2 size={18} />
            Exhibitors
            {exhibitors.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[var(--background-tertiary)]">
                {exhibitors.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'sponsors'
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground-muted)]'
            }`}
          >
            <Award size={18} />
            Sponsors
            {sponsors.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[var(--background-tertiary)]">
                {sponsors.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
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
                Choose an event to manage its industry partners.
              </p>
            </CardBody>
          </Card>
        ) : activeTab === 'exhibitors' ? (
          /* --- EXHIBITORS TAB --- */
          <>
            {/* Filters */}
            {exhibitors.length > 0 && (
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

            {filteredExhibitors.length === 0 ? (
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
                      <Button variant="secondary" icon={<Upload size={18} />} onClick={() => setShowImportModal(true)}>
                        Import from CSV
                      </Button>
                      <Button icon={<Plus size={18} />} onClick={() => handleOpenExhibitorForm()}>
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
                            onClick={() => handleOpenExhibitorForm(exhibitor)}
                            className="p-1.5 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteExhibitor(exhibitor)}
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

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--card-border)]">
                        <div className="flex items-center gap-1">
                          <Tag size={14} className="text-[var(--foreground-muted)] flex-shrink-0" />
                          <GroupAssignment
                            entityType="exhibitor"
                            entityId={exhibitor.id}
                            eventId={selectedEventId}
                            availableGroups={groups}
                            compact={true}
                          />
                        </div>
                        <button
                          onClick={() => openLeadsModal(exhibitor.company_name)}
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                          title="Manage leads access for this company's staff"
                        >
                          <Users size={12} />
                          Manage Leads
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          /* --- SPONSORS TAB --- */
          <>
            {/* Tier Filter */}
            {sponsors.length > 0 && (
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
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                    {tier.label}
                  </button>
                ))}
              </div>
            )}

            {filteredSponsors.length === 0 ? (
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
                      <Button variant="secondary" icon={<Upload size={18} />} onClick={() => setShowImportModal(true)}>
                        Import from CSV
                      </Button>
                      <Button icon={<Plus size={18} />} onClick={() => handleOpenSponsorForm()}>
                        Add Sponsor
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ) : selectedTier ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSponsors.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    tierInfo={getTierInfo(sponsor.tier)}
                    groups={groups}
                    eventId={selectedEventId}
                    onEdit={() => handleOpenSponsorForm(sponsor)}
                    onDelete={() => handleDeleteSponsor(sponsor)}
                    onToggleLeads={() => openLeadsModal(sponsor.company_name)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {SPONSOR_TIERS.map((tier) => {
                  const tieredSponsors = sponsorsByTier[tier.value]
                  if (!tieredSponsors || tieredSponsors.length === 0) return null
                  return (
                    <div key={tier.value}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: tier.color }} />
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
                            onEdit={() => handleOpenSponsorForm(sponsor)}
                            onDelete={() => handleDeleteSponsor(sponsor)}
                            onToggleLeads={() => openLeadsModal(sponsor.company_name)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Exhibitor Form Modal */}
      {showExhibitorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                {editingExhibitor ? 'Edit Exhibitor' : 'Add Exhibitor'}
              </h3>
              <button
                onClick={() => setShowExhibitorForm(false)}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-[var(--background-secondary)]" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-[var(--background-tertiary)] flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-[var(--foreground-subtle)]" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (editingExhibitor) {
                          setUploadingLogo(true)
                          try {
                            const url = await uploadExhibitorLogo(editingExhibitor.id, file)
                            setLogoPreview(url)
                          } catch (err) {
                            console.error('Error uploading logo:', err)
                          } finally {
                            setUploadingLogo(false)
                          }
                        } else {
                          const reader = new FileReader()
                          reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<Upload size={14} />}
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? 'Uploading...' : logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">Company Name *</label>
                <input
                  type="text"
                  value={exhibitorFormData.company_name}
                  onChange={(e) => setExhibitorFormData({ ...exhibitorFormData, company_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                  placeholder="Acme Medical Devices"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">Description</label>
                <textarea
                  value={exhibitorFormData.description}
                  onChange={(e) => setExhibitorFormData({ ...exhibitorFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] resize-none"
                  placeholder="Brief description of the company..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-1">Booth Number</label>
                  <input
                    type="text"
                    value={exhibitorFormData.booth_number}
                    onChange={(e) => setExhibitorFormData({ ...exhibitorFormData, booth_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="A101"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-1">Category</label>
                  <select
                    value={exhibitorFormData.category}
                    onChange={(e) => setExhibitorFormData({ ...exhibitorFormData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                  >
                    <option value="">Select category</option>
                    {EXHIBITOR_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exhibitorFormData.leads_enabled}
                    onChange={(e) => setExhibitorFormData({ ...exhibitorFormData, leads_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--input-border)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  <span className="text-sm text-[var(--foreground)] flex items-center gap-1">
                    <Users size={14} className="text-emerald-500" />
                    Leads Access
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">Website URL</label>
                <input
                  type="url"
                  value={exhibitorFormData.website_url}
                  onChange={(e) => setExhibitorFormData({ ...exhibitorFormData, website_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                  placeholder="https://example.com"
                />
              </div>

              <div className="border-t border-[var(--card-border)] pt-4">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={exhibitorFormData.contact_name}
                    onChange={(e) => setExhibitorFormData({ ...exhibitorFormData, contact_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="Contact name"
                  />
                  <input
                    type="email"
                    value={exhibitorFormData.contact_email}
                    onChange={(e) => setExhibitorFormData({ ...exhibitorFormData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="contact@example.com"
                  />
                  <input
                    type="tel"
                    value={exhibitorFormData.contact_phone}
                    onChange={(e) => setExhibitorFormData({ ...exhibitorFormData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="555-123-4567"
                  />
                </div>
              </div>

              {/* Documents Section */}
              <div className="border-t border-[var(--card-border)] pt-4">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Documents & Literature</h4>
                {pendingDocs.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {pendingDocs.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--background-secondary)]">
                        <FileText size={16} className="text-red-500 flex-shrink-0" />
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent-primary)] hover:underline truncate flex-1">
                          {doc.title}
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = pendingDocs.filter((_, i) => i !== idx)
                            setPendingDocs(updated)
                            await deleteExhibitorDocument(doc.url)
                            if (editingExhibitor) {
                              await updateExhibitor(editingExhibitor.id, { documents: updated.length > 0 ? updated : null })
                              const data = await getExhibitors(selectedEventId)
                              setExhibitors(data)
                            }
                          }}
                          className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--accent-danger)]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="Document title"
                  />
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !docTitle.trim()) return
                      if (!editingExhibitor) return
                      setUploadingDoc(true)
                      try {
                        const doc = await uploadExhibitorDocument(editingExhibitor.id, file, docTitle.trim())
                        const updated = [...pendingDocs, doc]
                        setPendingDocs(updated)
                        setDocTitle('')
                        await updateExhibitor(editingExhibitor.id, { documents: updated })
                        const data = await getExhibitors(selectedEventId)
                        setExhibitors(data)
                      } catch (err) {
                        console.error('Error uploading document:', err)
                      } finally {
                        setUploadingDoc(false)
                        if (docInputRef.current) docInputRef.current.value = ''
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Upload size={14} />}
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploadingDoc || !docTitle.trim() || !editingExhibitor}
                  >
                    {uploadingDoc ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
                {!editingExhibitor && (
                  <p className="text-xs text-[var(--foreground-muted)] mt-2">Save the exhibitor first, then edit to upload documents.</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
              <Button variant="ghost" onClick={() => setShowExhibitorForm(false)}>Cancel</Button>
              <Button onClick={handleSaveExhibitor} disabled={saving || !exhibitorFormData.company_name.trim()}>
                {saving ? 'Saving...' : editingExhibitor ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sponsor Form Modal */}
      {showSponsorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                {editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}
              </h3>
              <button
                onClick={() => setShowSponsorForm(false)}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-[var(--background-secondary)]" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-[var(--background-tertiary)] flex items-center justify-center">
                      <Award className="h-8 w-8 text-[var(--foreground-subtle)]" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (editingSponsor) {
                          setUploadingLogo(true)
                          try {
                            const url = await uploadSponsorLogo(editingSponsor.id, file)
                            setLogoPreview(url)
                          } catch (err) {
                            console.error('Error uploading logo:', err)
                          } finally {
                            setUploadingLogo(false)
                          }
                        } else {
                          const reader = new FileReader()
                          reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<Upload size={14} />}
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? 'Uploading...' : logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">Company Name *</label>
                <input
                  type="text"
                  value={sponsorFormData.company_name}
                  onChange={(e) => setSponsorFormData({ ...sponsorFormData, company_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                  placeholder="Pfizer Dermatology"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">Description</label>
                <textarea
                  value={sponsorFormData.description}
                  onChange={(e) => setSponsorFormData({ ...sponsorFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] resize-none"
                  placeholder="Brief description of the sponsor..."
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Sponsor Tier *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SPONSOR_TIERS.map((tier) => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => setSponsorFormData({ ...sponsorFormData, tier: tier.value as Sponsor['tier'] })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                        sponsorFormData.tier === tier.value
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : 'border-[var(--card-border)] hover:border-[var(--accent-primary)]/50'
                      }`}
                    >
                      <span className="block w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: tier.color }} />
                      <span className="text-xs text-[var(--foreground)]">{tier.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-1">Booth Number</label>
                  <input
                    type="text"
                    value={sponsorFormData.booth_number}
                    onChange={(e) => setSponsorFormData({ ...sponsorFormData, booth_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="Main Hall"
                  />
                </div>
                <div className="flex flex-col gap-2 justify-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sponsorFormData.is_featured}
                      onChange={(e) => setSponsorFormData({ ...sponsorFormData, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded border-[var(--input-border)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    <span className="text-sm text-[var(--foreground)] flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" />
                      Featured
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sponsorFormData.leads_enabled}
                      onChange={(e) => setSponsorFormData({ ...sponsorFormData, leads_enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-[var(--input-border)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    <span className="text-sm text-[var(--foreground)] flex items-center gap-1">
                      <Users size={14} className="text-emerald-500" />
                      Leads Access
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">Website URL</label>
                <input
                  type="url"
                  value={sponsorFormData.website_url}
                  onChange={(e) => setSponsorFormData({ ...sponsorFormData, website_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                  placeholder="https://example.com"
                />
              </div>

              <div className="border-t border-[var(--card-border)] pt-4">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={sponsorFormData.contact_name}
                    onChange={(e) => setSponsorFormData({ ...sponsorFormData, contact_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="Contact name"
                  />
                  <input
                    type="email"
                    value={sponsorFormData.contact_email}
                    onChange={(e) => setSponsorFormData({ ...sponsorFormData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              {/* Documents Section */}
              <div className="border-t border-[var(--card-border)] pt-4">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Documents & Literature</h4>
                {pendingDocs.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {pendingDocs.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--background-secondary)]">
                        <FileText size={16} className="text-red-500 flex-shrink-0" />
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent-primary)] hover:underline truncate flex-1">
                          {doc.title}
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = pendingDocs.filter((_, i) => i !== idx)
                            setPendingDocs(updated)
                            await deleteSponsorDocument(doc.url)
                            if (editingSponsor) {
                              await updateSponsor(editingSponsor.id, { documents: updated.length > 0 ? updated : null })
                              const data = await getSponsors(selectedEventId)
                              setSponsors(data)
                            }
                          }}
                          className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--accent-danger)]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="Document title"
                  />
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !docTitle.trim()) return
                      if (!editingSponsor) return
                      setUploadingDoc(true)
                      try {
                        const doc = await uploadSponsorDocument(editingSponsor.id, file, docTitle.trim())
                        const updated = [...pendingDocs, doc]
                        setPendingDocs(updated)
                        setDocTitle('')
                        await updateSponsor(editingSponsor.id, { documents: updated })
                        const data = await getSponsors(selectedEventId)
                        setSponsors(data)
                      } catch (err) {
                        console.error('Error uploading document:', err)
                      } finally {
                        setUploadingDoc(false)
                        if (docInputRef.current) docInputRef.current.value = ''
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Upload size={14} />}
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploadingDoc || !docTitle.trim() || !editingSponsor}
                  >
                    {uploadingDoc ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
                {!editingSponsor && (
                  <p className="text-xs text-[var(--foreground-muted)] mt-2">Save the sponsor first, then edit to upload documents.</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
              <Button variant="ghost" onClick={() => setShowSponsorForm(false)}>Cancel</Button>
              <Button onClick={handleSaveSponsor} disabled={saving || !sponsorFormData.company_name.trim()}>
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
                Import {activeTab === 'exhibitors' ? 'Exhibitors' : 'Sponsors'} from CSV
              </h3>
              <button
                onClick={() => { setShowImportModal(false); setImportResult(null) }}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                  Upload a CSV file with {activeTab === 'exhibitors' ? 'exhibitor' : 'sponsor'} information. Download the template to see the required format.
                </p>
                <Button variant="ghost" size="sm" icon={<Download size={16} />} onClick={handleDownloadTemplate}>
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
                    {importResult.created} {activeTab === 'exhibitors' ? 'exhibitor' : 'sponsor'}{importResult.created !== 1 ? 's' : ''} imported successfully
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
              <Button variant="ghost" onClick={() => { setShowImportModal(false); setImportResult(null) }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* People Import Modal (industry partner attendees) */}
      {showPeopleImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                Import Industry Partner People
              </h3>
              <button
                onClick={() => { setShowPeopleImportModal(false); setPeopleImportResult(null) }}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                  Upload an Excel or CSV file with industry partner representatives.
                  They will be added as attendees with the &quot;Industry&quot; badge type.
                  Duplicate emails will be skipped automatically.
                </p>
                <div className="bg-[var(--background-tertiary)] rounded-lg p-3 text-sm">
                  <p className="font-medium text-[var(--foreground)] mb-1">Expected Columns:</p>
                  <ul className="text-[var(--foreground-muted)] space-y-0.5 text-xs">
                    <li><code className="bg-[var(--input-bg)] px-1 rounded">Company Name</code>, <code className="bg-[var(--input-bg)] px-1 rounded">First Name</code>, <code className="bg-[var(--input-bg)] px-1 rounded">Last Name</code> - Required</li>
                    <li><code className="bg-[var(--input-bg)] px-1 rounded">Title</code>, <code className="bg-[var(--input-bg)] px-1 rounded">Phone Number</code>, <code className="bg-[var(--input-bg)] px-1 rounded">E-mail</code> - Optional</li>
                    <li><code className="bg-[var(--input-bg)] px-1 rounded">City and State</code> - Auto-split into separate fields</li>
                  </ul>
                </div>
              </div>
              <div className="border-2 border-dashed border-[var(--input-border)] rounded-lg p-6 text-center">
                <input
                  ref={peopleFileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handlePeopleFileSelect}
                  className="hidden"
                  id="people-upload"
                />
                <label htmlFor="people-upload" className="cursor-pointer">
                  {importingPeople ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mb-2" />
                      <span className="text-sm text-[var(--foreground-muted)]">Importing...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload size={32} className="text-[var(--foreground-subtle)] mb-2" />
                      <span className="text-sm text-[var(--foreground)]">Click to select Excel or CSV file</span>
                      <span className="text-xs text-[var(--foreground-muted)] mt-1">or drag and drop</span>
                    </div>
                  )}
                </label>
              </div>
              {peopleImportResult && (
                <div className={`p-3 rounded-lg ${peopleImportResult.errors.length > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {peopleImportResult.created} {peopleImportResult.created !== 1 ? 'people' : 'person'} imported successfully
                  </p>
                  {peopleImportResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">Warnings:</p>
                      <ul className="text-xs text-[var(--accent-warning)] space-y-0.5 max-h-32 overflow-y-auto">
                        {peopleImportResult.errors.slice(0, 10).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {peopleImportResult.errors.length > 10 && (
                          <li>...and {peopleImportResult.errors.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t border-[var(--card-border)]">
              <Button variant="ghost" onClick={() => { setShowPeopleImportModal(false); setPeopleImportResult(null) }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Leads Access Modal — pick specific people from a company */}
      {leadsModalCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Manage Leads Access</h3>
                <p className="text-sm text-[var(--foreground-muted)]">{leadsModalCompany}</p>
              </div>
              <button
                onClick={() => setLeadsModalCompany(null)}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {leadsModalLoading ? (
                <p className="text-sm text-[var(--foreground-muted)] text-center py-8">Loading staff...</p>
              ) : leadsModalStaff.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-8 w-8 text-[var(--foreground-subtle)] mb-2" />
                  <p className="text-sm text-[var(--foreground-muted)]">No attendees found from this company.</p>
                  <p className="text-xs text-[var(--foreground-subtle)] mt-1">
                    Attendees need their Institution field set to &ldquo;{leadsModalCompany}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--foreground-muted)] mb-3">
                    Toggle leads access for individual staff members.
                  </p>
                  {leadsModalStaff.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[var(--card-border)] hover:bg-[var(--background-secondary)]"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {person.first_name} {person.last_name}
                          {person.credentials && (
                            <span className="text-[var(--foreground-muted)]">, {person.credentials}</span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {person.title || person.email}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleAttendeeLeads(person.id, person.leads_access)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          person.leads_access ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                            person.leads_access ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center p-4 border-t border-[var(--card-border)]">
              <p className="text-xs text-[var(--foreground-muted)]">
                {leadsModalStaff.filter((s) => s.leads_access).length} of {leadsModalStaff.length} with leads access
              </p>
              <Button variant="ghost" onClick={() => setLeadsModalCompany(null)}>
                Done
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
  onToggleLeads,
}: {
  sponsor: Sponsor
  tierInfo: { value: string; label: string; color: string }
  groups: EventGroup[]
  eventId: string
  onEdit: () => void
  onDelete: () => void
  onToggleLeads: () => void
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
                <h3 className="font-semibold text-[var(--foreground)]">{sponsor.company_name}</h3>
                {sponsor.is_featured && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tierInfo.color }} />
                <span className="text-xs text-[var(--foreground-muted)]">{tierInfo.label}</span>
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
          <p className="text-sm text-[var(--foreground-muted)] mb-3 line-clamp-2">{sponsor.description}</p>
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
              <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-primary)] truncate">
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

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--card-border)]">
          <div className="flex items-center gap-1">
            <Tag size={14} className="text-[var(--foreground-muted)] flex-shrink-0" />
            <GroupAssignment
              entityType="sponsor"
              entityId={sponsor.id}
              eventId={eventId}
              availableGroups={groups}
              compact={true}
            />
          </div>
          <button
            onClick={onToggleLeads}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
            title="Manage leads access for this company's staff"
          >
            <Users size={12} />
            Manage Leads
          </button>
        </div>
      </CardBody>
    </Card>
  )
}
