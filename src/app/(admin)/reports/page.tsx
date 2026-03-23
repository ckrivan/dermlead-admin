'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getReports, updateReportStatus, deleteReportedContent } from '@/lib/api/reports'
import { useEvent } from '@/contexts/EventContext'
import { useAuth } from '@/contexts/AuthContext'
import type { ContentReport } from '@/types/database'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Clock,
  MessageSquare,
  FileText,
  User,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

type FilterTab = 'all' | 'pending' | 'reviewed' | 'dismissed' | 'actioned'

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  spam: { label: 'Spam', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  harassment: { label: 'Harassment', color: 'bg-red-100 text-red-800 border-red-300' },
  inappropriate: { label: 'Inappropriate', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  misinformation: { label: 'Misinfo', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700 border-gray-300' },
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-amber-600', icon: <Clock size={14} /> },
  reviewed: { label: 'Reviewed', color: 'text-blue-600', icon: <Eye size={14} /> },
  dismissed: { label: 'Dismissed', color: 'text-gray-500', icon: <XCircle size={14} /> },
  actioned: { label: 'Actioned', color: 'text-green-600', icon: <CheckCircle size={14} /> },
}

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  post: <FileText size={14} />,
  comment: <MessageSquare size={14} />,
  message: <MessageSquare size={14} />,
  question: <FileText size={14} />,
  photo: <FileText size={14} />,
}

export default function ModerationPage() {
  const { selectedEvent } = useEvent()
  const { profile } = useAuth()
  const selectedEventId = selectedEvent?.id ?? ''

  const [reports, setReports] = useState<ContentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getReports(selectedEventId || undefined)
      setReports(data)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedEventId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDismiss = async (report: ContentReport) => {
    if (!profile?.id) return
    setActionLoading(report.id)
    try {
      await updateReportStatus(report.id, 'dismissed', 'none', profile.id)
      await loadData()
    } catch (error) {
      console.error('Error dismissing report:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveContent = async (report: ContentReport) => {
    if (!profile?.id) return
    if (!confirm('Remove this content? This cannot be undone.')) return

    setActionLoading(report.id)
    try {
      await deleteReportedContent(report.content_type, report.content_id)
      await updateReportStatus(report.id, 'actioned', 'removed', profile.id)
      await loadData()
    } catch (error) {
      console.error('Error removing content:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredReports = activeTab === 'all'
    ? reports
    : reports.filter((r) => r.status === activeTab)

  const pendingCount = reports.filter((r) => r.status === 'pending').length

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: reports.filter((r) => r.status === 'pending').length },
    { key: 'actioned', label: 'Actioned', count: reports.filter((r) => r.status === 'actioned').length },
    { key: 'dismissed', label: 'Dismissed', count: reports.filter((r) => r.status === 'dismissed').length },
    { key: 'all', label: 'All', count: reports.length },
  ]

  return (
    <>
      <Header
        title="Moderation"
        subtitle={pendingCount > 0 ? `${pendingCount} pending report${pendingCount !== 1 ? 's' : ''}` : 'Content reports & moderation'}
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
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Shield size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                {activeTab === 'pending' ? 'No pending reports' : 'No reports found'}
              </h3>
              <p className="text-[var(--foreground-muted)]">
                {activeTab === 'pending'
                  ? 'All clear! No content has been flagged for review.'
                  : `No ${activeTab === 'all' ? '' : activeTab + ' '}reports to show.`}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isLoading={actionLoading === report.id}
                onDismiss={() => handleDismiss(report)}
                onRemove={() => handleRemoveContent(report)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ReportCard({
  report,
  isLoading,
  onDismiss,
  onRemove,
}: {
  report: ContentReport
  isLoading: boolean
  onDismiss: () => void
  onRemove: () => void
}) {
  const reason = REASON_LABELS[report.reason] || REASON_LABELS.other
  const status = STATUS_LABELS[report.status] || STATUS_LABELS.pending
  const contentIcon = CONTENT_TYPE_ICONS[report.content_type] || <FileText size={14} />
  const isPending = report.status === 'pending'

  return (
    <Card hover={isPending}>
      <CardBody className={!isPending ? 'opacity-70' : undefined}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header: reason badge + status + timestamp */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${reason.color}`}>
                <AlertTriangle size={11} />
                {reason.label}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                {status.icon}
                {status.label}
              </span>
              <span className="text-xs text-[var(--foreground-subtle)]">
                {format(parseISO(report.created_at), 'MMM d, h:mm a')}
              </span>
            </div>

            {/* Reported content preview */}
            <div className="bg-[var(--background-secondary)] rounded-lg p-3 border border-[var(--card-border)]">
              <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] mb-1">
                {contentIcon}
                <span className="capitalize">{report.content_type}</span>
                {report.content_author_name && (
                  <>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {report.content_author_name}
                    </span>
                  </>
                )}
              </div>
              {report.content_title && (
                <p className="text-sm font-medium text-[var(--foreground)] mb-0.5">
                  {report.content_title}
                </p>
              )}
              {report.content_body ? (
                <p className="text-sm text-[var(--foreground-muted)] line-clamp-3">
                  {report.content_body}
                </p>
              ) : (
                <p className="text-sm text-[var(--foreground-subtle)] italic">
                  Content not found (may have been deleted)
                </p>
              )}
            </div>

            {/* Reporter + details */}
            <div className="text-xs text-[var(--foreground-muted)]">
              <span>Reported by <span className="font-medium">{report.reporter_name}</span></span>
              {report.details && (
                <p className="mt-1 text-[var(--foreground)] bg-[var(--background)] rounded px-2 py-1 border border-[var(--card-border)]">
                  &ldquo;{report.details}&rdquo;
                </p>
              )}
            </div>

            {/* Action taken note */}
            {report.action_taken && report.action_taken !== 'none' && (
              <p className="text-xs text-green-600 font-medium">
                Content {report.action_taken}
                {report.reviewed_at && ` on ${format(parseISO(report.reviewed_at), 'MMM d, h:mm a')}`}
              </p>
            )}
          </div>

          {/* Action buttons */}
          {isPending && (
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={onRemove}
                disabled={isLoading}
              >
                Remove
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<XCircle size={16} />}
                onClick={onDismiss}
                disabled={isLoading}
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
