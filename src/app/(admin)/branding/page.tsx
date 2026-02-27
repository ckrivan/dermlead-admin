'use client'

import { useEffect, useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import {
  getBrandingSettings,
  updateBrandingSettings,
  uploadEventLogo,
  uploadEventBanner,
  deleteEventLogo,
  deleteEventBanner,
  DEFAULT_BRAND_COLOR,
  BrandingSettings,
} from '@/lib/api/branding'
import { getEvents } from '@/lib/api/events'
import type { Event } from '@/types/database'
import { isAbortError } from '@/contexts/EventContext'
import {
  Palette,
  Image,
  Upload,
  Trash2,
  RotateCcw,
  Smartphone,
  Monitor,
  Check,
} from 'lucide-react'

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // purple
]

export default function BrandingPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<BrandingSettings>({
    brand_color: DEFAULT_BRAND_COLOR,
    logo_url: null,
    banner_url: null,
    show_logo_on_banner: false,
    custom_url_slug: null,
  })
  const [previewTab, setPreviewTab] = useState<'mobile' | 'web'>('mobile')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    async function loadBranding() {
      if (!selectedEventId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await getBrandingSettings(selectedEventId)
        if (data) {
          setSettings(data)
        } else {
          setSettings({
            brand_color: DEFAULT_BRAND_COLOR,
            logo_url: null,
            banner_url: null,
            show_logo_on_banner: false,
            custom_url_slug: null,
          })
        }
      } catch (error) {
        console.error('Error loading branding:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBranding()
  }, [selectedEventId])

  const handleColorChange = async (color: string) => {
    setSettings((prev) => ({ ...prev, brand_color: color }))
  }

  const handleSave = async () => {
    if (!selectedEventId) return

    setSaving(true)
    try {
      await updateBrandingSettings(selectedEventId, {
        brand_color: settings.brand_color,
        show_logo_on_banner: settings.show_logo_on_banner,
        custom_url_slug: settings.custom_url_slug,
      })
    } catch (error) {
      console.error('Error saving branding:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setSaving(true)
    try {
      const url = await uploadEventLogo(selectedEventId, file)
      setSettings((prev) => ({ ...prev, logo_url: url }))
    } catch (error) {
      console.error('Error uploading logo:', error)
    } finally {
      setSaving(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setSaving(true)
    try {
      const url = await uploadEventBanner(selectedEventId, file)
      setSettings((prev) => ({ ...prev, banner_url: url }))
    } catch (error) {
      console.error('Error uploading banner:', error)
    } finally {
      setSaving(false)
      if (bannerInputRef.current) {
        bannerInputRef.current.value = ''
      }
    }
  }

  const handleDeleteLogo = async () => {
    if (!selectedEventId || !confirm('Delete the event logo?')) return

    setSaving(true)
    try {
      await deleteEventLogo(selectedEventId)
      setSettings((prev) => ({ ...prev, logo_url: null }))
    } catch (error) {
      console.error('Error deleting logo:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBanner = async () => {
    if (!selectedEventId || !confirm('Delete the event banner?')) return

    setSaving(true)
    try {
      await deleteEventBanner(selectedEventId)
      setSettings((prev) => ({ ...prev, banner_url: null }))
    } catch (error) {
      console.error('Error deleting banner:', error)
    } finally {
      setSaving(false)
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title="Branding" />

      <main className="p-6">
        {/* Event Selector */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Select Event:
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Select an event...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          </CardBody>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto"></div>
            <p className="mt-2 text-[var(--muted-foreground)]">Loading branding settings...</p>
          </div>
        ) : !selectedEventId ? (
          <Card>
            <CardBody className="text-center py-12">
              <Palette className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
              <p className="mt-2 text-[var(--muted-foreground)]">Select an event to customize its branding</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branding Settings */}
            <div className="space-y-6">
              {/* Brand Color */}
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5 text-[var(--primary)]" />
                    <h3 className="font-semibold text-[var(--foreground)]">Event Brand Color</h3>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    Used for the app header, buttons, and accent elements.
                  </p>

                  {/* Color Presets */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className="relative w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: settings.brand_color === color ? 'var(--foreground)' : 'transparent',
                        }}
                        title={color}
                      >
                        {settings.brand_color === color && (
                          <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Input */}
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.brand_color || DEFAULT_BRAND_COLOR}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-[var(--border)]"
                    />
                    <input
                      type="text"
                      value={settings.brand_color || DEFAULT_BRAND_COLOR}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleColorChange(DEFAULT_BRAND_COLOR)}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Reset
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Event Logo */}
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-4">
                    <Image className="h-5 w-5 text-[var(--primary)]" />
                    <h3 className="font-semibold text-[var(--foreground)]">Event Logo</h3>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    Displayed in the app header, emails, and event materials.
                  </p>

                  {settings.logo_url ? (
                    <div className="space-y-4">
                      <div className="relative w-full h-32 bg-[var(--secondary)] rounded-lg overflow-hidden">
                        <img
                          src={settings.logo_url}
                          alt="Event logo"
                          className="w-full h-full object-contain p-4"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => logoInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload size={16} />
                          Replace
                        </Button>
                        <Button
                          variant="danger"
                          onClick={handleDeleteLogo}
                          className="flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--secondary)] transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-[var(--muted-foreground)]" />
                      <span className="text-sm text-[var(--muted-foreground)]">
                        Click to upload logo
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        PNG, JPG, SVG up to 2MB
                      </span>
                    </button>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </CardBody>
              </Card>

              {/* Event Banner */}
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-4">
                    <Image className="h-5 w-5 text-[var(--primary)]" />
                    <h3 className="font-semibold text-[var(--foreground)]">Event Banner</h3>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    Displayed on the app home screen. Recommended: 750 x 300px.
                  </p>

                  {/* Show logo on banner checkbox */}
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.show_logo_on_banner}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          show_logo_on_banner: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">
                      Show event logo on banner
                    </span>
                  </label>

                  {settings.banner_url ? (
                    <div className="space-y-4">
                      <div className="relative w-full aspect-[2.5/1] bg-[var(--secondary)] rounded-lg overflow-hidden">
                        <img
                          src={settings.banner_url}
                          alt="Event banner"
                          className="w-full h-full object-cover"
                        />
                        {settings.show_logo_on_banner && settings.logo_url && (
                          <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg p-2">
                            <img
                              src={settings.logo_url}
                              alt="Logo overlay"
                              className="h-8 w-auto object-contain"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => bannerInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload size={16} />
                          Replace
                        </Button>
                        <Button
                          variant="danger"
                          onClick={handleDeleteBanner}
                          className="flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-full aspect-[2.5/1] border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--secondary)] transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-[var(--muted-foreground)]" />
                      <span className="text-sm text-[var(--muted-foreground)]">
                        Click to upload banner
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        Recommended: 750 x 300px
                      </span>
                    </button>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </CardBody>
              </Card>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Preview Panel */}
            <div>
              <Card className="sticky top-6">
                <CardBody>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[var(--foreground)]">Preview</h3>
                    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                      <button
                        onClick={() => setPreviewTab('mobile')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                          previewTab === 'mobile'
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                        }`}
                      >
                        <Smartphone size={16} />
                        Mobile
                      </button>
                      <button
                        onClick={() => setPreviewTab('web')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                          previewTab === 'web'
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                        }`}
                      >
                        <Monitor size={16} />
                        Web
                      </button>
                    </div>
                  </div>

                  {previewTab === 'mobile' ? (
                    /* Mobile Preview */
                    <div className="mx-auto w-[280px] rounded-[2rem] border-8 border-gray-800 bg-white overflow-hidden shadow-xl">
                      {/* Status Bar */}
                      <div
                        className="h-6 flex items-center justify-between px-4 text-white text-xs"
                        style={{ backgroundColor: settings.brand_color || DEFAULT_BRAND_COLOR }}
                      >
                        <span>9:41</span>
                        <div className="flex gap-1">
                          <span>5G</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Header */}
                      <div
                        className="h-14 flex items-center justify-between px-4"
                        style={{ backgroundColor: settings.brand_color || DEFAULT_BRAND_COLOR }}
                      >
                        {settings.logo_url ? (
                          <img
                            src={settings.logo_url}
                            alt="Logo"
                            className="h-8 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {selectedEvent?.name || 'Event'}
                          </span>
                        )}
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-white/20" />
                          <div className="w-6 h-6 rounded-full bg-white/20" />
                        </div>
                      </div>

                      {/* Banner */}
                      <div className="relative aspect-[2.5/1] bg-gray-200">
                        {settings.banner_url ? (
                          <>
                            <img
                              src={settings.banner_url}
                              alt="Banner"
                              className="w-full h-full object-cover"
                            />
                            {settings.show_logo_on_banner && settings.logo_url && (
                              <div className="absolute bottom-2 left-2 bg-white/90 rounded p-1.5">
                                <img
                                  src={settings.logo_url}
                                  alt="Logo"
                                  className="h-5 w-auto object-contain"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div className="font-semibold text-gray-900">
                          {selectedEvent?.name || 'Event Name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedEvent?.location || 'Event Location'}
                        </div>
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {['Home', 'Agenda', 'Speakers', 'More'].map((tab) => (
                            <div
                              key={tab}
                              className="text-center text-xs text-gray-500"
                            >
                              <div
                                className="w-6 h-6 rounded mx-auto mb-1"
                                style={{
                                  backgroundColor: tab === 'Home' ? settings.brand_color || DEFAULT_BRAND_COLOR : '#e5e7eb',
                                }}
                              />
                              {tab}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Web Preview */
                    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
                      {/* Browser Chrome */}
                      <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-3 gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                          <div className="w-3 h-3 rounded-full bg-yellow-400" />
                          <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="bg-white rounded px-3 py-0.5 text-xs text-gray-500 text-center">
                            converge.app/{selectedEvent?.slug || 'event'}
                          </div>
                        </div>
                      </div>

                      {/* Header */}
                      <div
                        className="h-16 flex items-center justify-between px-6"
                        style={{ backgroundColor: settings.brand_color || DEFAULT_BRAND_COLOR }}
                      >
                        {settings.logo_url ? (
                          <img
                            src={settings.logo_url}
                            alt="Logo"
                            className="h-10 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {selectedEvent?.name || 'Event'}
                          </span>
                        )}
                        <div className="flex gap-4 text-white/80 text-sm">
                          <span>Home</span>
                          <span>Agenda</span>
                          <span>Speakers</span>
                          <span>Attendees</span>
                        </div>
                      </div>

                      {/* Banner */}
                      <div className="relative aspect-[4/1] bg-gray-200">
                        {settings.banner_url ? (
                          <>
                            <img
                              src={settings.banner_url}
                              alt="Banner"
                              className="w-full h-full object-cover"
                            />
                            {settings.show_logo_on_banner && settings.logo_url && (
                              <div className="absolute bottom-3 left-4 bg-white/90 rounded-lg p-2">
                                <img
                                  src={settings.logo_url}
                                  alt="Logo"
                                  className="h-8 w-auto object-contain"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                          {selectedEvent?.name || 'Event Name'}
                        </h2>
                        <p className="text-gray-500 mb-4">
                          {selectedEvent?.location || 'Event Location'}
                        </p>
                        <div className="flex gap-3">
                          <button
                            className="px-4 py-2 rounded-lg text-white text-sm"
                            style={{ backgroundColor: settings.brand_color || DEFAULT_BRAND_COLOR }}
                          >
                            View Agenda
                          </button>
                          <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">
                            Browse Speakers
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
