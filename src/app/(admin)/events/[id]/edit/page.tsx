'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Input,
  Textarea,
  ColorPicker,
  ConfirmDialog,
} from '@/components/ui'
import {
  getEvent,
  updateEvent,
  deleteEvent,
  archiveEvent,
  uploadEventBanner,
  uploadEventLogo,
  generateSlug,
  generateInviteCode,
} from '@/lib/api/events'
import type { Event } from '@/types/database'
import { ArrowLeft, Save, Trash2, Archive, Upload, RefreshCw, X, Plus } from 'lucide-react'
import Link from 'next/link'

interface EditEventPageProps {
  params: Promise<{ id: string }>
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    description: '',
    invite_code: '',
    brand_color: '#3b82f6',
  })

  const [tracks, setTracks] = useState<string[]>([])
  const [newTrack, setNewTrack] = useState('')
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await getEvent(id)
        if (data) {
          setEvent(data)
          setFormData({
            name: data.name,
            location: data.location || '',
            start_date: data.start_date,
            end_date: data.end_date,
            description: data.description || '',
            invite_code: data.invite_code || '',
            brand_color: data.brand_color || '#3b82f6',
          })
          setTracks(data.tracks || [])
          setBannerPreview(data.banner_url)
          setLogoPreview(data.logo_url)
        }
      } catch (error) {
        console.error('Error loading event:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEvent()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBanner(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => setBannerPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      const url = await uploadEventBanner(id, file)
      setBannerPreview(url)
      await updateEvent(id, { banner_url: url })
    } catch (error) {
      console.error('Error uploading banner:', error)
      alert('Failed to upload banner. Please try again.')
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => setLogoPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      const url = await uploadEventLogo(id, file)
      setLogoPreview(url)
      await updateEvent(id, { logo_url: url })
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo. Please try again.')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleGenerateInviteCode = () => {
    const code = generateInviteCode()
    setFormData((prev) => ({ ...prev, invite_code: code }))
  }

  const addTrack = () => {
    if (newTrack.trim() && !tracks.includes(newTrack.trim())) {
      setTracks((prev) => [...prev, newTrack.trim()])
      setNewTrack('')
    }
  }

  const removeTrack = (track: string) => {
    setTracks((prev) => prev.filter((t) => t !== track))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Event name is required'
    if (!formData.start_date) newErrors.start_date = 'Start date is required'
    if (!formData.end_date) newErrors.end_date = 'End date is required'
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await updateEvent(id, {
        name: formData.name,
        slug: generateSlug(formData.name),
        location: formData.location || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description || null,
        invite_code: formData.invite_code || null,
        brand_color: formData.brand_color,
        tracks: tracks.length > 0 ? tracks : null,
      })

      router.push('/events')
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Failed to update event. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteEvent(id)
      router.push('/events')
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await archiveEvent(id)
      router.push('/events')
    } catch (error) {
      console.error('Error archiving event:', error)
      alert('Failed to archive event. Please try again.')
    } finally {
      setArchiving(false)
      setShowArchiveDialog(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Edit Event" />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
        </div>
      </>
    )
  }

  if (!event) {
    return (
      <>
        <Header title="Event Not Found" />
        <div className="p-6">
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-[var(--foreground-muted)]">
                The event you&apos;re looking for doesn&apos;t exist.
              </p>
              <Link href="/events" className="mt-4 inline-block">
                <Button>Back to Events</Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Edit Event" subtitle={event.name} />

      <div className="p-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6"
        >
          <ArrowLeft size={18} />
          Back to Events
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-[var(--foreground)]">Event Details</h3>

                  <Input
                    label="Event Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., DermCon 2026"
                    error={errors.name}
                  />

                  <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., San Diego Convention Center"
                  />

                  <Textarea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Event description..."
                    rows={4}
                  />
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-[var(--foreground)]">Dates</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Start Date *"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleChange}
                      error={errors.start_date}
                    />
                    <Input
                      label="End Date *"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleChange}
                      error={errors.end_date}
                    />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-[var(--foreground)]">Branding</h3>

                  <ColorPicker
                    label="Brand Color"
                    value={formData.brand_color}
                    onChange={(color) => setFormData((prev) => ({ ...prev, brand_color: color }))}
                  />
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-[var(--foreground)]">Tracks</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Define tracks for organizing sessions (e.g., Clinical, Business, Research)
                  </p>

                  <div className="flex gap-2">
                    <Input
                      value={newTrack}
                      onChange={(e) => setNewTrack(e.target.value)}
                      placeholder="Add a track..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTrack()
                        }
                      }}
                    />
                    <Button type="button" onClick={addTrack} icon={<Plus size={18} />}>
                      Add
                    </Button>
                  </div>

                  {tracks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tracks.map((track) => (
                        <div
                          key={track}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm"
                        >
                          <span>{track}</span>
                          <button
                            type="button"
                            onClick={() => removeTrack(track)}
                            className="hover:text-[var(--accent-danger)]"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Danger Zone */}
              <Card className="border-[var(--accent-danger)]/30">
                <CardBody>
                  <h3 className="font-semibold text-[var(--accent-danger)] mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mb-4">
                    Archive this event to hide it from the list, or permanently delete it along with all associated data.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      icon={<Archive size={16} />}
                      onClick={() => setShowArchiveDialog(true)}
                    >
                      Archive Event
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      icon={<Trash2 size={16} />}
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete Event
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Banner Upload */}
              <Card>
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-[var(--foreground)]">Event Banner</h3>

                  {bannerPreview ? (
                    <div className="relative">
                      <img
                        src={bannerPreview}
                        alt="Event banner"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-sm font-medium">Change Banner</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-[var(--input-border)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors">
                      {uploadingBanner ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
                      ) : (
                        <>
                          <Upload size={24} className="text-[var(--foreground-muted)] mb-2" />
                          <span className="text-sm text-[var(--foreground-muted)]">
                            Upload banner image
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                        disabled={uploadingBanner}
                      />
                    </label>
                  )}
                </CardBody>
              </Card>

              {/* Logo Upload */}
              <Card>
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-[var(--foreground)]">Event Logo</h3>

                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Event logo"
                        className="w-full h-32 object-contain rounded-lg bg-[var(--background-tertiary)] p-4"
                      />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-sm font-medium">Change Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-[var(--input-border)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors">
                      {uploadingLogo ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
                      ) : (
                        <>
                          <Upload size={24} className="text-[var(--foreground-muted)] mb-2" />
                          <span className="text-sm text-[var(--foreground-muted)]">
                            Upload logo image
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                  )}
                </CardBody>
              </Card>

              {/* Invite Code */}
              <Card>
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-[var(--foreground)]">Invite Code</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Attendees can use this code to join the event
                  </p>

                  <div className="flex gap-2">
                    <Input
                      name="invite_code"
                      value={formData.invite_code}
                      onChange={handleChange}
                      placeholder="e.g., DERM26"
                      className="font-mono uppercase"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleGenerateInviteCode}
                      icon={<RefreshCw size={16} />}
                      title="Generate random code"
                    />
                  </div>

                  {formData.invite_code && (
                    <div className="p-3 rounded-lg bg-[var(--background-tertiary)] text-center">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">
                        Share this code with attendees
                      </p>
                      <p className="text-2xl font-mono font-bold text-[var(--accent-primary)]">
                        {formData.invite_code}
                      </p>
                    </div>
                  )}
                </CardBody>

                <CardFooter className="flex justify-end gap-3">
                  <Link href="/events">
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" loading={saving} icon={<Save size={18} />}>
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This will permanently delete all speakers, sessions, and attendees associated with this event. This action cannot be undone."
        confirmLabel="Delete Event"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showArchiveDialog}
        onClose={() => setShowArchiveDialog(false)}
        onConfirm={handleArchive}
        title="Archive Event"
        message="Are you sure you want to archive this event? It will be hidden from the events list but can be restored later."
        confirmLabel="Archive Event"
        cancelLabel="Cancel"
        variant="primary"
        loading={archiving}
      />
    </>
  )
}
