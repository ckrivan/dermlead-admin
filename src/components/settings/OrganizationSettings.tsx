'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, Button } from '@/components/ui'
import { Building2, Save } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

interface OrganizationData {
  id: string
  name: string
  slug: string | null
}

export function OrganizationSettings() {
  const { organization } = useAuth()
  const [orgData, setOrgData] = useState<OrganizationData | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadOrganization() {
      if (!organization?.id) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single()

      if (error) {
        console.error('Error loading organization:', error)
      } else if (data) {
        setOrgData(data)
        setName(data.name)
      }
      setLoading(false)
    }

    loadOrganization()
  }, [organization?.id])

  const handleSave = async () => {
    if (!orgData) return

    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('organizations')
        .update({ name })
        .eq('id', orgData.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Organization settings saved' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-[var(--background-tertiary)] rounded w-1/4"></div>
            <div className="h-10 bg-[var(--background-tertiary)] rounded"></div>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (!orgData) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <Building2 size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            No Organization Found
          </h3>
          <p className="text-[var(--foreground-muted)]">
            You are not associated with an organization.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Organization Details
          </h3>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                  : 'bg-red-500/10 border border-red-500/20 text-red-500'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
                Organization ID
              </label>
              <input
                type="text"
                value={orgData.id}
                disabled
                className="w-full px-4 py-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--card-border)] text-[var(--foreground-muted)] cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                This ID cannot be changed
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving || name === orgData.name}>
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
