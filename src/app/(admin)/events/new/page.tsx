'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardFooter, Button, Input, Textarea } from '@/components/ui'
import { createEvent, generateSlug, generateInviteCode } from '@/lib/api/events'
import { createClient } from '@/lib/supabase/client'
import type { Organization } from '@/types/database'
import { ArrowLeft, Save, RefreshCw, X, Plus } from 'lucide-react'
import Link from 'next/link'

export default function NewEventPage() {
  const router = useRouter()

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(true)

  const [formData, setFormData] = useState({
    organization_id: '',
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    description: '',
    invite_code: '',
  })

  const [tracks, setTracks] = useState<string[]>([])
  const [newTrack, setNewTrack] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name')

        if (error) throw error
        setOrganizations(data || [])

        // Auto-select first organization if only one exists
        if (data && data.length === 1) {
          setFormData((prev) => ({ ...prev, organization_id: data[0].id }))
        }
      } catch (error) {
        console.error('Error loading organizations:', error)
      } finally {
        setLoadingOrgs(false)
      }
    }
    loadOrganizations()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
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

    if (!formData.organization_id) newErrors.organization_id = 'Please select an organization'
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

    setLoading(true)
    try {
      await createEvent({
        organization_id: formData.organization_id,
        name: formData.name,
        slug: generateSlug(formData.name),
        location: formData.location || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description || null,
        invite_code: formData.invite_code || null,
        banner_url: null,
        tracks: tracks.length > 0 ? tracks : null,
        brand_color: null,
        logo_url: null,
        show_logo_on_banner: false,
        custom_url_slug: null,
      })

      router.push('/events')
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Create Event" subtitle="Set up a new convention or conference" />

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

                  {/* Organization Selection */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-[var(--foreground)]">
                      Organization *
                    </label>
                    {loadingOrgs ? (
                      <div className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground-muted)]">
                        Loading organizations...
                      </div>
                    ) : (
                      <select
                        name="organization_id"
                        value={formData.organization_id}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border ${
                          errors.organization_id
                            ? 'border-[var(--accent-danger)]'
                            : 'border-[var(--input-border)]'
                        } text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]`}
                      >
                        <option value="">Select an organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.organization_id && (
                      <p className="text-sm text-[var(--accent-danger)]">{errors.organization_id}</p>
                    )}
                  </div>

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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
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
                  <Button type="submit" loading={loading} icon={<Save size={18} />}>
                    Create Event
                  </Button>
                </CardFooter>
              </Card>

              {/* Help Text */}
              <Card>
                <CardBody className="space-y-2 text-sm text-[var(--foreground-muted)]">
                  <h4 className="font-medium text-[var(--foreground)]">Tips</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You can upload a banner image after creating the event</li>
                    <li>Tracks help organize sessions into categories</li>
                    <li>The invite code allows attendees to join your event</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
