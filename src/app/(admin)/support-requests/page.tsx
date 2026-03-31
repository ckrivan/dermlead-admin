'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getSupportRequests, updateSupportStatus } from '@/lib/api/support'
import { useAuth } from '@/contexts/AuthContext'
import type { SupportRequest } from '@/types/database'
import {
  LifeBuoy,
  Clock,
  CheckCircle,
  Loader,
  Mail,
  User,
  MessageSquare,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

type FilterTab = 'new' | 'in_progress' | 'resolved' | 'all'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'New', color: 'text-amber-600', icon: <Clock size={14} /> },
  in_progress: { label: 'In Progress', color: 'text-blue-600', icon: <Loader size={14} /> },
  resolved: { label: 'Resolved', color: 'text-green-600', icon: <CheckCircle size={14} /> },
}

export default function SupportPage() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('new')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const data = await getSupportRequests()
      setRequests(data)
    } catch (error) {
      console.error('Error loading support requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false // eslint-disable-line prefer-const
    async function fetchData() {
      setLoading(true)
      try {
        const data = await getSupportRequests()
        if (cancelled) return
        setRequests(data)
      } catch (error) {
        if (cancelled) return
        console.error('Error loading support requests:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const handleStatusChange = async (id: string, status: 'in_progress' | 'resolved') => {
    if (!profile?.id) return
    setActionLoading(id)
    try {
      await updateSupportStatus(id, status, profile.id)
      await loadData()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredRequests = activeTab === 'all'
    ? requests
    : requests.filter((r) => r.status === activeTab)

  const newCount = requests.filter((r) => r.status === 'new').length

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'new', label: 'New', count: requests.filter((r) => r.status === 'new').length },
    { key: 'in_progress', label: 'In Progress', count: requests.filter((r) => r.status === 'in_progress').length },
    { key: 'resolved', label: 'Resolved', count: requests.filter((r) => r.status === 'resolved').length },
    { key: 'all', label: 'All', count: requests.length },
  ]

  return (
    <>
      <Header
        title="Support"
        subtitle={newCount > 0 ? `${newCount} new request${newCount !== 1 ? 's' : ''}` : 'Support requests'}
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-[var(--background-secondary)] rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <LifeBuoy size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                {activeTab === 'new' ? 'No new requests' : 'No requests found'}
              </h3>
              <p className="text-[var(--foreground-muted)]">
                {activeTab === 'new'
                  ? 'All clear! No support requests need attention.'
                  : `No ${activeTab === 'all' ? '' : activeTab.replace('_', ' ') + ' '}requests to show.`}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.new
              const isLoading = actionLoading === req.id

              return (
                <Card key={req.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                          <span className="text-xs text-[var(--foreground-subtle)]">
                            {format(parseISO(req.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>

                        {/* Subject */}
                        <h3 className="font-semibold text-[var(--foreground)]">{req.subject}</h3>

                        {/* Message */}
                        <p className="text-sm text-[var(--foreground-muted)] whitespace-pre-line">
                          {req.message}
                        </p>

                        {/* Contact info */}
                        <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {req.name}
                          </span>
                          <a
                            href={`mailto:${req.email}?subject=Re: ${encodeURIComponent(req.subject)}`}
                            className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline"
                          >
                            <Mail size={12} />
                            {req.email}
                          </a>
                        </div>

                        {req.resolved_at && (
                          <p className="text-xs text-green-600 font-medium">
                            Resolved on {format(parseISO(req.resolved_at), 'MMM d, h:mm a')}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {req.status !== 'resolved' && (
                        <div className="flex flex-col gap-2 shrink-0">
                          {req.status === 'new' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<Loader size={16} />}
                              onClick={() => handleStatusChange(req.id, 'in_progress')}
                              disabled={isLoading}
                            >
                              In Progress
                            </Button>
                          )}
                          <Button
                            size="sm"
                            icon={<CheckCircle size={16} />}
                            onClick={() => handleStatusChange(req.id, 'resolved')}
                            disabled={isLoading}
                          >
                            Resolve
                          </Button>
                          <a
                            href={`mailto:${req.email}?subject=Re: ${encodeURIComponent(req.subject)}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--card-border)] text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] transition-colors"
                          >
                            <MessageSquare size={14} />
                            Reply
                          </a>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
