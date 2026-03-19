'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardBody, Button, Input } from '@/components/ui'
import { useEvent } from '@/contexts/EventContext'
import {
  getLeadAccessCompanies,
  addLeadAccessCompany,
  toggleLeadAccess,
  removeLeadAccessCompany,
  type LeadAccessCompany,
} from '@/lib/api/lead-access'
import { Plus, Trash2, ToggleLeft, ToggleRight, Key } from 'lucide-react'

export function LeadAccessSettings() {
  const { selectedEvent } = useEvent()
  const eventId = selectedEvent?.id ?? ''

  const [companies, setCompanies] = useState<LeadAccessCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [newCompany, setNewCompany] = useState('')
  const [adding, setAdding] = useState(false)

  const loadCompanies = useCallback(async () => {
    if (!eventId) {
      setCompanies([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getLeadAccessCompanies(eventId)
      setCompanies(data)
    } catch (err) {
      console.error('Error loading lead access companies:', err)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCompany.trim() || !eventId) return

    setAdding(true)
    try {
      await addLeadAccessCompany(eventId, newCompany)
      setNewCompany('')
      await loadCompanies()
    } catch (err) {
      console.error('Error adding company:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleToggle = async (company: LeadAccessCompany) => {
    try {
      await toggleLeadAccess(company.id, !company.enabled)
      await loadCompanies()
    } catch (err) {
      console.error('Error toggling access:', err)
    }
  }

  const handleRemove = async (company: LeadAccessCompany) => {
    if (!confirm(`Remove ${company.company_name} from lead access?`)) return
    try {
      await removeLeadAccessCompany(company.id)
      await loadCompanies()
    } catch (err) {
      console.error('Error removing company:', err)
    }
  }

  if (!eventId) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <Key size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
          <p className="text-[var(--foreground-muted)]">Select an event to manage lead retrieval access.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Lead Retrieval Access
          </h3>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            Only companies listed here can use lead retrieval for <strong>{selectedEvent?.name}</strong>.
            Admins and BCI staff always have access.
          </p>

          {/* Add company form */}
          <form onSubmit={handleAdd} className="flex gap-3 mb-6">
            <Input
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Company name (e.g., Eli Lilly)"
              className="flex-1"
            />
            <Button type="submit" icon={<Plus size={16} />} disabled={adding || !newCompany.trim()}>
              {adding ? 'Adding...' : 'Add'}
            </Button>
          </form>

          {/* Companies list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-primary)]" />
            </div>
          ) : companies.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
              No companies added yet. All reps will be blocked from lead retrieval until you add their company.
            </p>
          ) : (
            <div className="space-y-2">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)]"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(company)}
                      className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      {company.enabled ? (
                        <ToggleRight size={24} className="text-green-500" />
                      ) : (
                        <ToggleLeft size={24} className="text-[var(--foreground-subtle)]" />
                      )}
                    </button>
                    <span className={`font-medium ${company.enabled ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)] line-through'}`}>
                      {company.company_name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    className="text-[var(--accent-danger)]"
                    onClick={() => handleRemove(company)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
