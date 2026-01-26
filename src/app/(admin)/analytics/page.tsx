'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, CardHeader, Button } from '@/components/ui'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Filter,
  Trophy,
  PieChart as PieChartIcon,
  Clock,
  Target,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { getAnalyticsData, type AnalyticsData, type DateRange } from '@/lib/api/analytics'
import { getEvents } from '@/lib/api/events'
import type { Event } from '@/types/database'
import { format, subDays, subMonths } from 'date-fns'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const INTEREST_COLORS: Record<string, string> = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
  unknown: '#6b7280',
}

type DateRangePreset = '7d' | '30d' | '90d' | 'all'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30d')
  const [loading, setLoading] = useState(true)

  const getDateRange = (preset: DateRangePreset): DateRange | undefined => {
    const now = new Date()
    const endDate = format(now, 'yyyy-MM-dd')

    switch (preset) {
      case '7d':
        return { startDate: format(subDays(now, 7), 'yyyy-MM-dd'), endDate }
      case '30d':
        return { startDate: format(subDays(now, 30), 'yyyy-MM-dd'), endDate }
      case '90d':
        return { startDate: format(subMonths(now, 3), 'yyyy-MM-dd'), endDate }
      case 'all':
        return undefined
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [analyticsData, eventsData] = await Promise.all([
          getAnalyticsData(selectedEvent || undefined, getDateRange(dateRangePreset)),
          getEvents(),
        ])
        setAnalytics(analyticsData)
        setEvents(eventsData)
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedEvent, dateRangePreset])

  const handleExportPDF = () => {
    // Trigger print dialog for PDF export
    window.print()
  }

  if (loading) {
    return (
      <>
        <Header title="Analytics Dashboard" subtitle="Lead capture metrics and insights" />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-[var(--foreground-muted)]">Loading analytics...</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Analytics Dashboard" subtitle="Lead capture metrics and insights" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardBody className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-[var(--foreground-muted)]" />
              <span className="font-medium text-[var(--foreground)]">Filters:</span>
            </div>

            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            >
              <option value="">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>

            <div className="flex gap-1 bg-[var(--background-tertiary)] p-1 rounded-lg">
              {[
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' },
                { value: '90d', label: '90 Days' },
                { value: 'all', label: 'All Time' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRangePreset(option.value as DateRangePreset)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateRangePreset === option.value
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="ml-auto">
              <Button variant="secondary" onClick={handleExportPDF}>
                <Download size={16} className="mr-2" />
                Export PDF
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-400/10">
                <Target className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Total Leads</p>
                <p className="text-2xl font-semibold text-[var(--foreground)]">
                  {analytics?.totalLeads || 0}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-400/10">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">High Interest</p>
                <p className="text-2xl font-semibold text-[var(--foreground)]">
                  {analytics?.leadScoreDistribution.find((d) => d.interestLevel === 'high')?.count || 0}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-400/10">
                <Calendar className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Events</p>
                <p className="text-2xl font-semibold text-[var(--foreground)]">
                  {analytics?.leadsByEvent.length || 0}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-400/10">
                <Users className="text-orange-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">Active Reps</p>
                <p className="text-2xl font-semibold text-[var(--foreground)]">
                  {analytics?.leadsByRep.length || 0}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Score Distribution (Pie Chart) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon size={20} className="text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Lead Score Distribution</h2>
              </div>
            </CardHeader>
            <CardBody>
              {analytics && analytics.leadScoreDistribution.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.leadScoreDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ interestLevel, percentage }) => `${interestLevel}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="interestLevel"
                      >
                        {analytics.leadScoreDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={INTEREST_COLORS[entry.interestLevel] || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-bg)',
                          border: '1px solid var(--card-border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-[var(--foreground-muted)]">
                  No lead data available
                </div>
              )}
            </CardBody>
          </Card>

          {/* Leads by Event (Bar Chart) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Leads by Event</h2>
              </div>
            </CardHeader>
            <CardBody>
              {analytics && analytics.leadsByEvent.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.leadsByEvent.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis type="number" stroke="var(--foreground-muted)" />
                      <YAxis
                        dataKey="eventName"
                        type="category"
                        width={120}
                        tick={{ fontSize: 12 }}
                        stroke="var(--foreground-muted)"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-bg)',
                          border: '1px solid var(--card-border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-[var(--foreground-muted)]">
                  No event data available
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Capture Trends Over Time (Line Chart) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Capture Trends Over Time</h2>
              </div>
            </CardHeader>
            <CardBody>
              {analytics && analytics.captureOverTime.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.captureOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis
                        dataKey="date"
                        stroke="var(--foreground-muted)"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      />
                      <YAxis stroke="var(--foreground-muted)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-bg)',
                          border: '1px solid var(--card-border)',
                          borderRadius: '8px',
                        }}
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-[var(--foreground-muted)]">
                  No capture data available
                </div>
              )}
            </CardBody>
          </Card>

          {/* Hourly Capture Patterns */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Hourly Capture Patterns</h2>
              </div>
            </CardHeader>
            <CardBody>
              {analytics && analytics.hourlyPatterns.some((p) => p.count > 0) ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.hourlyPatterns}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis
                        dataKey="hour"
                        stroke="var(--foreground-muted)"
                        tickFormatter={(value) => `${value}:00`}
                      />
                      <YAxis stroke="var(--foreground-muted)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-bg)',
                          border: '1px solid var(--card-border)',
                          borderRadius: '8px',
                        }}
                        labelFormatter={(value) => `${value}:00 - ${value}:59`}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-[var(--foreground-muted)]">
                  No hourly data available
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Leaderboard and Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rep Leaderboard */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Rep Leaderboard</h2>
              </div>
            </CardHeader>
            <CardBody>
              {analytics && analytics.leadsByRep.length > 0 ? (
                <div className="space-y-3">
                  {analytics.leadsByRep.slice(0, 10).map((rep, index) => (
                    <div
                      key={rep.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-tertiary)]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-yellow-400/20 text-yellow-600'
                              : index === 1
                              ? 'bg-gray-300/20 text-gray-600'
                              : index === 2
                              ? 'bg-orange-400/20 text-orange-600'
                              : 'bg-blue-400/10 text-blue-400'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="font-medium text-[var(--foreground)]">{rep.repName}</span>
                      </div>
                      <span className="text-lg font-semibold text-[var(--foreground)]">{rep.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-[var(--foreground-muted)]">
                  No rep data available
                </div>
              )}
            </CardBody>
          </Card>

          {/* Top Topics of Interest */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target size={20} className="text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Top Topics of Interest</h2>
              </div>
            </CardHeader>
            <CardBody>
              {analytics && analytics.specialtyBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {analytics.specialtyBreakdown.map((topic, index) => {
                    const maxCount = analytics.specialtyBreakdown[0]?.count || 1
                    const percentage = (topic.count / maxCount) * 100
                    return (
                      <div key={topic.specialty} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--foreground)]">{topic.specialty}</span>
                          <span className="text-[var(--foreground-muted)]">{topic.count}</span>
                        </div>
                        <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-[var(--foreground-muted)]">
                  No topic data available
                </div>
              )}
            </CardBody>
          </Card>
        </div>
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
        }
      `}</style>
    </>
  )
}
