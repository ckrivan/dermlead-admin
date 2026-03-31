'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardFooter, Button, Input, Textarea } from '@/components/ui'
import { createSpeaker, updateSpeaker, uploadSpeakerPhoto } from '@/lib/api/speakers'
import { getEvents } from '@/lib/api/events'
import { getCroppedImg } from '@/lib/utils/cropImage'
import type { Event } from '@/types/database'
import { isAbortError } from '@/contexts/EventContext'
import { ArrowLeft, Upload, User, Save, Crop, X } from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import Link from 'next/link'

function NewSpeakerForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get('eventId')

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const [formData, setFormData] = useState({
    event_id: eventIdParam || '',
    full_name: '',
    credentials: '',
    bio: '',
    specialty: '',
    institution: '',
    city: '',
    state: '',
    email: '',
    linkedin_url: '',
    website_url: '',
    role: ['faculty'] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleRole = (roleValue: string) => {
    setFormData((prev) => {
      const currentRoles = prev.role
      if (currentRoles.includes(roleValue)) {
        if (currentRoles.length === 1) return prev
        return { ...prev, role: currentRoles.filter((r) => r !== roleValue) }
      }
      return { ...prev, role: [...currentRoles, roleValue] }
    })
  }

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCropImage(reader.result as string)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels) return
    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], 'photo.jpg', { type: 'image/jpeg' })
      setPhotoFile(croppedFile)
      setPhotoPreview(URL.createObjectURL(croppedBlob))
      setShowCropModal(false)
      setCropImage(null)
    } catch (e) {
      console.error('Error cropping image:', e)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.event_id) {
      newErrors.event_id = 'Please select an event'
    }
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      const speaker = await createSpeaker({
        event_id: formData.event_id,
        full_name: formData.full_name,
        credentials: formData.credentials || null,
        bio: formData.bio || null,
        specialty: formData.specialty || null,
        institution: formData.institution || null,
        city: formData.city || null,
        state: formData.state || null,
        email: formData.email || null,
        linkedin_url: formData.linkedin_url || null,
        website_url: formData.website_url || null,
        photo_url: null,
        role: formData.role,
      })

      if (photoFile) {
        const photoUrl = await uploadSpeakerPhoto(speaker.id, photoFile)
        await updateSpeaker(speaker.id, { photo_url: photoUrl })
      }

      router.refresh()
      router.push('/speakers')
    } catch (error) {
      console.error('Error creating speaker:', error)
      alert('Failed to create speaker. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <Link
        href="/speakers"
        className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6"
      >
        <ArrowLeft size={18} />
        Back to Speakers
      </Link>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo Upload */}
          <Card>
            <CardBody className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[var(--background-tertiary)] flex items-center justify-center">
                    <User size={48} className="text-[var(--foreground-subtle)]" />
                  </div>
                )}
              </div>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Upload size={16} />}
                  onClick={() =>
                    document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
                  }
                >
                  Upload Photo
                </Button>
              </label>
              <p className="text-xs text-[var(--foreground-muted)] mt-2 text-center">
                Recommended: Square image, at least 200x200px
              </p>
            </CardBody>
          </Card>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody className="space-y-4">
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
                    <p className="text-sm text-[var(--accent-danger)]">
                      {errors.event_id}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Full Name *"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Dr. Jane Smith"
                    error={errors.full_name}
                  />
                  <Input
                    label="Credentials"
                    name="credentials"
                    value={formData.credentials}
                    onChange={handleChange}
                    placeholder="MD, PhD, FAAD"
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-[var(--foreground)]">
                      Roles
                    </label>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {[
                        { value: 'faculty', label: 'Faculty' },
                        { value: 'leader', label: 'Leader' },
                        { value: 'organiser', label: 'Organizer' },
                      ].map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.role.includes(opt.value)}
                            onChange={() => toggleRole(opt.value)}
                            className="rounded border-[var(--input-border)] text-[var(--accent-primary)] focus:ring-[var(--input-focus)]"
                          />
                          <span className="text-sm text-[var(--foreground)]">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    placeholder="Dermatology"
                  />
                  <Input
                    label="Institution"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="Harvard Medical School"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Orlando"
                  />
                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="FL"
                  />
                </div>

                <Textarea
                  label="Bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Brief biography of the speaker..."
                  rows={4}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="speaker@example.com"
                  />
                  <Input
                    label="LinkedIn URL"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <Input
                  label="Website URL"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </CardBody>

              <CardFooter className="flex justify-end gap-3">
                <Link href="/speakers">
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  loading={loading}
                  icon={<Save size={18} />}
                >
                  Create Speaker
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>

      {/* Crop Modal */}
      {showCropModal && cropImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <Crop size={18} />
                <h3 className="font-semibold text-[var(--foreground)]">Crop Photo</h3>
              </div>
              <button
                onClick={() => { setShowCropModal(false); setCropImage(null) }}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative w-full" style={{ height: 400 }}>
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--foreground-muted)]">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setShowCropModal(false); setCropImage(null) }}>
                  Cancel
                </Button>
                <Button onClick={handleCropSave} icon={<Crop size={16} />}>
                  Apply Crop
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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

export default function NewSpeakerPage() {
  return (
    <>
      <Header title="Add Faculty" subtitle="Create a new faculty profile" />
      <Suspense fallback={<LoadingFallback />}>
        <NewSpeakerForm />
      </Suspense>
    </>
  )
}
