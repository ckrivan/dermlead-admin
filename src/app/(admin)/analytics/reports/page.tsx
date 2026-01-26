'use client'

import { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader, Button } from '@/components/ui'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import {
  getEventSummaryReport,
  getRepPerformanceReport,
  getAnalyticsData,
  type EventSummaryReport,
  type RepPerformanceReport,
  type DateRange,
} from '@/lib/api/analytics'
import { getEvents } from '@/lib/api/events'
import type { Event } from '@/types/database'
import { format, subDays, subMonths } from 'date-fns'

type ReportType = 'event-summary' | 'rep-performance' | 'lead-quality'

interface ReportConfig {
  id: ReportType
  name: string
  description: string
  icon: typeof FileText
  color: string
  bgColor: string
}

const reportConfigs: ReportConfig[] = [
  {
    id: 'event-summary',
    name: 'Event Summary Report',
    description: 'Overview of leads captured at a specific event',
    icon: Calendar,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    id: 'rep-performance',
    name: 'Rep Performance Report',
    description: 'Individual rep lead capture and conversion metrics',
    icon: Users,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  {
    id: 'lead-quality',
    name: 'Lead Quality Analysis',
    description: 'Breakdown of lead quality and interest levels',
    icon: TrendingUp,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
]

export default function ReportsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [reps, setReps] = useState<{ userId: string; repName: string }[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedRepId, setSelectedRepId] = useState<string>('')
  const [reportData, setReportData] = useState<EventSummaryReport | RepPerformanceReport | null>(null)
  const [loading, setLoading] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsData, analyticsData] = await Promise.all([getEvents(), getAnalyticsData()])
        setEvents(eventsData)
        setReps(analyticsData.leadsByRep)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [])

  const generateReport = async () => {
    if (!selectedReport) return

    setLoading(true)
    setReportData(null)

    try {
      if (selectedReport === 'event-summary' && selectedEventId) {
        const data = await getEventSummaryReport(selectedEventId)
        setReportData(data)
      } else if (selectedReport === 'rep-performance' && selectedRepId) {
        const data = await getRepPerformanceReport(selectedRepId)
        setReportData(data)
      } else if (selectedReport === 'lead-quality') {
        const analytics = await getAnalyticsData()
        // Create a lead quality report structure
        setReportData({
          event: { name: 'All Events' } as Event,
          totalLeads: analytics.totalLeads,
          leadsByInterest: analytics.leadScoreDistribution,
          topReps: analytics.leadsByRep.slice(0, 5),
          captureTimeline: analytics.captureOverTime,
        } as EventSummaryReport)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    // Use browser print to PDF
    window.print()
  }

  const isEventSummary = (data: EventSummaryReport | RepPerformanceReport | null): data is EventSummaryReport => {
    return data !== null && 'event' in data
  }

  const isRepPerformance = (data: EventSummaryReport | RepPerformanceReport | null): data is RepPerformanceReport => {
    return data !== null && 'conversionRate' in data
  }

  return (
    <>
      <Header title="Reports" subtitle="Generate and export detailed reports" />

      <div className="p-6 space-y-6">
        {/* Report Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportConfigs.map((config) => (
            <Card
              key={config.id}
              hover
              onClick={() => {
                setSelectedReport(config.id)
                setReportData(null)
              }}
              className={selectedReport === config.id ? 'ring-2 ring-[var(--accent-primary)]' : ''}
            >
              <CardBody className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${config.bgColor}`}>
                  <config.icon className={config.color} size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--foreground)]">{config.name}</h3>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">{config.description}</p>
                </div>
                <ChevronRight size={20} className="text-[var(--foreground-muted)]" />
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Report Configuration */}
        {selectedReport && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Configure Report</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {selectedReport === 'event-summary' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Select Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full md:w-80 px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="">Choose an event...</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedReport === 'rep-performance' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Select Rep
                  </label>
                  <select
                    value={selectedRepId}
                    onChange={(e) => setSelectedRepId(e.target.value)}
                    className="w-full md:w-80 px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="">Choose a rep...</option>
                    {reps.map((rep) => (
                      <option key={rep.userId} value={rep.userId}>
                        {rep.repName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={generateReport}
                  disabled={
                    loading ||
                    (selectedReport === 'event-summary' && !selectedEventId) ||
                    (selectedReport === 'rep-performance' && !selectedRepId)
                  }
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Report Output */}
        {reportData && (
          <div ref={reportRef} className="print:p-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between no-print">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {selectedReport === 'event-summary'
                    ? 'Event Summary Report'
                    : selectedReport === 'rep-performance'
                    ? 'Rep Performance Report'
                    : 'Lead Quality Analysis'}
                </h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handlePrint}>
                    <Printer size={16} className="mr-2" />
                    Print
                  </Button>
                  <Button variant="primary" onClick={handleExportPDF}>
                    <Download size={16} className="mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* Report Header */}
                <div className="border-b border-[var(--card-border)] pb-4">
                  <h1 className="text-2xl font-bold text-[var(--foreground)]">
                    {isEventSummary(reportData) && reportData.event?.name}
                    {isRepPerformance(reportData) && reportData.repName}
                  </h1>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Generated on {format(new Date(), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>

                {/* Event Summary Report Content */}
                {isEventSummary(reportData) && (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-[var(--background-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">Total Leads</p>
                        <p className="text-2xl font-bold text-[var(--foreground)]">{reportData.totalLeads}</p>
                      </div>
                      <div className="p-4 bg-[var(--background-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">High Interest</p>
                        <p className="text-2xl font-bold text-green-500">
                          {reportData.leadsByInterest.find((l) => l.interestLevel === 'high')?.count || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-[var(--background-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">Medium Interest</p>
                        <p className="text-2xl font-bold text-yellow-500">
                          {reportData.leadsByInterest.find((l) => l.interestLevel === 'medium')?.count || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-[var(--background-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">Low Interest</p>
                        <p className="text-2xl font-bold text-red-500">
                          {reportData.leadsByInterest.find((l) => l.interestLevel === 'low')?.count || 0}
                        </p>
                      </div>
                    </div>

                    {/* Interest Level Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                        Lead Interest Distribution
                      </h3>
                      <div className="space-y-2">
                        {reportData.leadsByInterest.map((item) => (
                          <div key={item.interestLevel} className="flex items-center gap-4">
                            <span className="w-24 text-sm text-[var(--foreground)]">{item.interestLevel}</span>
                            <div className="flex-1 h-4 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.interestLevel === 'high'
                                    ? 'bg-green-500'
                                    : item.interestLevel === 'medium'
                                    ? 'bg-yellow-500'
                                    : item.interestLevel === 'low'
                                    ? 'bg-red-500'
                                    : 'bg-gray-500'
                                }`}
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="w-16 text-sm text-right text-[var(--foreground-muted)]">
                              {item.count} ({item.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Reps */}
                    {reportData.topReps.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Top Performing Reps</h3>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[var(--card-border)]">
                              <th className="text-left py-2 text-sm font-medium text-[var(--foreground-muted)]">
                                Rank
                              </th>
                              <th className="text-left py-2 text-sm font-medium text-[var(--foreground-muted)]">
                                Rep Name
                              </th>
                              <th className="text-right py-2 text-sm font-medium text-[var(--foreground-muted)]">
                                Leads Captured
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.topReps.map((rep, index) => (
                              <tr key={rep.userId} className="border-b border-[var(--card-border)]/50">
                                <td className="py-2 text-[var(--foreground)]">{index + 1}</td>
                                <td className="py-2 text-[var(--foreground)]">{rep.repName}</td>
                                <td className="py-2 text-right text-[var(--foreground)]">{rep.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* Rep Performance Report Content */}
                {isRepPerformance(reportData) && (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-[var(--background-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">Total Leads</p>
                        <p className="text-2xl font-bold text-[var(--foreground)]">{reportData.totalLeads}</p>
                      </div>
                      <div className="p-4 bg-[var(--background-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">Conversion Rate</p>
                        <p className="text-2xl font-bold text-green-500">{reportData.conversionRate}%</p>
                      </div>
                      <div className="p-4 bg-[var(--background-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">Avg/Day</p>
                        <p className="text-2xl font-bold text-blue-500">{reportData.averageLeadsPerDay}</p>
                      </div>
                      <div className="p-4 bg-[var(--background-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">High Interest</p>
                        <p className="text-2xl font-bold text-purple-500">{reportData.highInterestLeads}</p>
                      </div>
                    </div>

                    {/* Lead Quality Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Lead Quality Breakdown</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-green-500/10 rounded-lg text-center">
                          <p className="text-3xl font-bold text-green-500">{reportData.highInterestLeads}</p>
                          <p className="text-sm text-[var(--foreground-muted)]">High Interest</p>
                        </div>
                        <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
                          <p className="text-3xl font-bold text-yellow-500">{reportData.mediumInterestLeads}</p>
                          <p className="text-sm text-[var(--foreground-muted)]">Medium Interest</p>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-lg text-center">
                          <p className="text-3xl font-bold text-red-500">{reportData.lowInterestLeads}</p>
                          <p className="text-sm text-[var(--foreground-muted)]">Low Interest</p>
                        </div>
                      </div>
                    </div>

                    {/* Events Performance */}
                    {reportData.leadsByEvent.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Performance by Event</h3>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[var(--card-border)]">
                              <th className="text-left py-2 text-sm font-medium text-[var(--foreground-muted)]">
                                Event
                              </th>
                              <th className="text-right py-2 text-sm font-medium text-[var(--foreground-muted)]">
                                Leads Captured
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.leadsByEvent.map((event) => (
                              <tr key={event.eventId} className="border-b border-[var(--card-border)]/50">
                                <td className="py-2 text-[var(--foreground)]">{event.eventName}</td>
                                <td className="py-2 text-right text-[var(--foreground)]">{event.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          aside,
          header:first-of-type {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
