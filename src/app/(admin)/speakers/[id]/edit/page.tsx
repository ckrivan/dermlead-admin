'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardFooter, Button, Input, Textarea } from '@/components/ui'
import { getSpeaker, updateSpeaker, uploadSpeakerPhoto, deleteSpeaker } from '@/lib/api/speakers'
import type { Speaker } from '@/types/database'
import { ArrowLeft, Upload, User, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface EditSpeakerPageProps {
  params: Promise<{ id: string }>
}

export default function EditSpeakerPage({ params }: EditSpeakerPageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    credentials: '',
    bio: '',
    specialty: '',
    institution: '',
    email: '',
    linkedin_url: '',
    website_url: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadSpeaker() {
      try {
        const data = await getSpeaker(id)
        if (data) {
          setSpeaker(data)
          setFormData({
            full_name: data.full_name,
            credentials: data.credentials || '',
            bio: data.bio || '',
            specialty: data.specialty || '',
            institution: data.institution || '',
            email: data.email || '',
            linkedin_url: data.linkedin_url || '',
            website_url: data.website_url || '',
          })
          if (data.photo_url) {
            setPhotoPreview(data.photo_url)
          }
        }
      } catch (error) {
        console.error('Error loading speaker:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSpeaker()
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      let photoUrl = speaker?.photo_url || null

      // Upload new photo if provided
      if (photoFile) {
        photoUrl = await uploadSpeakerPhoto(id, photoFile)
      }

      await updateSpeaker(id, {
        full_name: formData.full_name,
        credentials: formData.credentials || null,
        bio: formData.bio || null,
        specialty: formData.specialty || null,
        institution: formData.institution || null,
        email: formData.email || null,
        linkedin_url: formData.linkedin_url || null,
        website_url: formData.website_url || null,
        photo_url: photoUrl,
      })

      router.push('/speakers')
    } catch (error) {
      console.error('Error updating speaker:', error)
      alert('Failed to update speaker. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this speaker? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      await deleteSpeaker(id)
      router.push('/speakers')
    } catch (error) {
      console.error('Error deleting speaker:', error)
      alert('Failed to delete speaker. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Edit Speaker" />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
        </div>
      </>
    )
  }

  if (!speaker) {
    return (
      <>
        <Header title="Speaker Not Found" />
        <div className="p-6">
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-[var(--foreground-muted)]">
                The speaker you&apos;re looking for doesn&apos;t exist.
              </p>
              <Link href="/speakers" className="mt-4 inline-block">
                <Button>Back to Speakers</Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Edit Speaker"
        subtitle={speaker.full_name}
      />

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
                    Change Photo
                  </Button>
                </label>

                <div className="mt-6 pt-6 border-t border-[var(--card-border)] w-full">
                  <Button
                    type="button"
                    variant="danger"
                    icon={<Trash2 size={16} />}
                    loading={deleting}
                    onClick={handleDelete}
                    className="w-full"
                  >
                    Delete Speaker
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardBody className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    loading={saving}
                    icon={<Save size={18} />}
                  >
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
