'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardFooter, Button, Input, Textarea } from '@/components/ui'
import { createSession, SESSION_TYPES, SPEAKER_ROLES } from '@/lib/api/sessions'
import { getEvents } from '@/lib/api/events'
import { getSpeakers } from '@/lib/api/speakers'
import type { Event, Speaker } from '@/types/database'
import { isAbortError } from '@/contexts/EventContext'
import { ArrowLeft, Save, Plus, X, User } from 'lucide-react'
import Link from 'next/link'

interface SpeakerAssignment {
  speakerId: string
  role: string
}

function NewSessionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get('eventId')

  const [events, setEvents] = useState<Event[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(false)
  const [speakerAssignments, setSpeakerAssignments] = useState<SpeakerAssignment[]>([])

  const [formData, setFormData] = useState({
    event_id: eventIdParam || '',
    title: '',
    description: '',
    session_type: 'presentation',
    session_date: '',
    start_time: '',
    end_time: '',
    location: '',
    track: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    async function loadEvents() {
      try {
        const data = await getEvents()
        if (cancelled) return
        setEvents(data)
      } catch (err: unknown) {
        if (cancelled) return
        if (isAbortError(err)) return
        console.error('Error loading events:', err)
      }
    }
    loadEvents()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (eventIdParam) {
      setFormData((prev) => ({ ...prev, event_id: eventIdParam }))
    }
  }, [eventIdParam])

  useEffect(() => {
    async function loadSpeakers() {
      if (!formData.event_id) {
        setSpeakers([])
        return
      }
      try {
        const data = await getSpeakers(formData.event_id)
        setSpeakers(data)
      } catch (error) {
        console.error('Error loading speakers:', error)
      }
    }
    loadSpeakers()
  }, [formData.event_id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const addSpeaker = () => {
    setSpeakerAssignments((prev) => [...prev, { speakerId: '', role: 'speaker' }])
  }

  const removeSpeaker = (index: number) => {
    setSpeakerAssignments((prev) => prev.filter((_, i) => i !== index))
  }

  const updateSpeakerAssignment = (
    index: number,
    field: 'speakerId' | 'role',
    value: string
  ) => {
    setSpeakerAssignments((prev) =>
      prev.map((sa, i) => (i === index ? { ...sa, [field]: value } : sa))
    )
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.event_id) newErrors.event_id = 'Please select an event'
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.session_date) newErrors.session_date = 'Date is required'
    if (!formData.start_time) newErrors.start_time = 'Start time is required'
    if (!formData.end_time) newErrors.end_time = 'End time is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const validAssignments = speakerAssignments.filter((sa) => sa.speakerId)

      await createSession(
        {
          event_id: formData.event_id,
          title: formData.title,
          description: formData.description || null,
          session_type: formData.session_type,
          session_date: formData.session_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location || null,
          track: formData.track || null,
          objectives: null,
        },
        validAssignments
      )

      router.push('/sessions')
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedEvent = events.find((e) => e.id === formData.event_id)

  return (
    <div className="p-6">
      <Link
        href="/sessions"
        className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6"
      >
        <ArrowLeft size={18} />
        Back to Sessions
      </Link>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-semibold text-[var(--foreground)]">Session Details</h3>

                {/* Event Selection */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-[var(--foreground)]">
                    Event *
                  </label>
                  <select
                    name="event_id"
                    value={formData.event_id}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border ${
                      errors.event_id
                        ? 'border-[var(--accent-danger)]'
                        : 'border-[var(--input-border)]'
                    } text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]`}
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                  {errors.event_id && (
                    <p className="text-sm text-[var(--accent-danger)]">{errors.event_id}</p>
                  )}
                </div>

                <Input
                  label="Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Session title"
                  error={errors.title}
                />

                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Session description..."
                  rows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-[var(--foreground)]">
                      Session Type
                    </label>
                    <select
                      name="session_type"
                      value={formData.session_type}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    >
                      {SESSION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Track"
                    name="track"
                    value={formData.track}
                    onChange={handleChange}
                    placeholder="e.g., Clinical, Business"
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-semibold text-[var(--foreground)]">Schedule</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Date *"
                    name="session_date"
                    type="date"
                    value={formData.session_date}
                    onChange={handleChange}
                    error={errors.session_date}
                    min={selectedEvent?.start_date}
                    max={selectedEvent?.end_date}
                  />
                  <Input
                    label="Start Time *"
                    name="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={handleChange}
                    error={errors.start_time}
                  />
                  <Input
                    label="End Time *"
                    name="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={handleChange}
                    error={errors.end_time}
                  />
                </div>

                <Input
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Main Ballroom, Room 101"
                />
              </CardBody>
            </Card>
          </div>

          {/* Speakers Panel */}
          <div>
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--foreground)]">Speakers</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Plus size={16} />}
                    onClick={addSpeaker}
                    disabled={speakers.length === 0}
                  >
                    Add
                  </Button>
                </div>

                {speakers.length === 0 && formData.event_id ? (
                  <p className="text-sm text-[var(--foreground-muted)]">
                    No speakers for this event yet.{' '}
                    <Link
                      href={`/speakers/new?eventId=${formData.event_id}`}
                      className="text-[var(--accent-primary)] hover:underline"
                    >
                      Add speakers first
                    </Link>
                  </p>
                ) : speakerAssignments.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-muted)]">
                    No speakers assigned. Click &quot;Add&quot; to assign speakers.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {speakerAssignments.map((sa, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-[var(--background-tertiary)] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--foreground-muted)]">
                            Speaker {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSpeaker(index)}
                            className="p-1 rounded hover:bg-[var(--background)] text-[var(--foreground-muted)]"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <select
                          value={sa.speakerId}
                          onChange={(e) =>
                            updateSpeakerAssignment(index, 'speakerId', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                        >
                          <option value="">Select speaker</option>
                          {speakers.map((speaker) => (
                            <option key={speaker.id} value={speaker.id}>
                              {speaker.full_name}
                              {speaker.credentials && `, ${speaker.credentials}`}
                            </option>
                          ))}
                        </select>
                        <select
                          value={sa.role}
                          onChange={(e) =>
                            updateSpeakerAssignment(index, 'role', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                        >
                          {SPEAKER_ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected speakers preview */}
                {speakerAssignments.some((sa) => sa.speakerId) && (
                  <div className="pt-3 border-t border-[var(--card-border)]">
                    <p className="text-xs text-[var(--foreground-muted)] mb-2">
                      Assigned Speakers:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {speakerAssignments
                        .filter((sa) => sa.speakerId)
                        .map((sa, index) => {
                          const speaker = speakers.find((s) => s.id === sa.speakerId)
                          if (!speaker) return null
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-2 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs"
                            >
                              {speaker.photo_url ? (
                                <img
                                  src={speaker.photo_url}
                                  alt={speaker.full_name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              ) : (
                                <User size={12} />
                              )}
                              <span>{speaker.full_name}</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </CardBody>

              <CardFooter className="flex justify-end gap-3">
                <Link href="/sessions">
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" loading={loading} icon={<Save size={18} />}>
                  Create Session
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
      </div>
    </div>
  )
}

export default function NewSessionPage() {
  return (
    <>
      <Header title="Add Session" subtitle="Create a new session for your event" />
      <Suspense fallback={<LoadingFallback />}>
        <NewSessionForm />
      </Suspense>
    </>
  )
}
