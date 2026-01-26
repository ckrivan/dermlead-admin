import { createClient } from '@/lib/supabase/client'
import type { Lead, Attendee, Event } from '@/types/database'

export interface LeadsByEvent {
  eventId: string
  eventName: string
  count: number
}

export interface LeadsByRep {
  userId: string
  repName: string
  count: number
}

export interface LeadScoreDistribution {
  interestLevel: string
  count: number
  percentage: number
}

export interface SpecialtyBreakdown {
  specialty: string
  count: number
}

export interface CaptureTimeData {
  date: string
  count: number
}

export interface HourlyPattern {
  hour: number
  count: number
}

export interface AnalyticsData {
  totalLeads: number
  leadsByEvent: LeadsByEvent[]
  leadsByRep: LeadsByRep[]
  leadScoreDistribution: LeadScoreDistribution[]
  specialtyBreakdown: SpecialtyBreakdown[]
  captureOverTime: CaptureTimeData[]
  hourlyPatterns: HourlyPattern[]
}

export interface DateRange {
  startDate: string
  endDate: string
}

export async function getLeads(eventId?: string, dateRange?: DateRange): Promise<Lead[]> {
  const supabase = createClient()

  let query = supabase.from('leads').select('*')

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  if (dateRange) {
    query = query
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    throw error
  }

  return data || []
}

export async function getAnalyticsData(eventId?: string, dateRange?: DateRange): Promise<AnalyticsData> {
  const supabase = createClient()

  // Fetch all data in parallel
  const [leadsResult, eventsResult] = await Promise.all([
    (async () => {
      let query = supabase.from('leads').select('*')
      if (eventId) {
        query = query.eq('event_id', eventId)
      }
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.startDate)
          .lte('created_at', dateRange.endDate)
      }
      return query
    })(),
    supabase.from('events').select('id, name'),
  ])

  if (leadsResult.error) {
    console.error('Error fetching leads:', leadsResult.error)
    throw leadsResult.error
  }

  const leads = leadsResult.data || []
  const events = eventsResult.data || []

  // Create events map
  const eventsMap = new Map<string, string>()
  events.forEach((e) => eventsMap.set(e.id, e.name))

  // Calculate total leads
  const totalLeads = leads.length

  // Calculate leads by event
  const eventCounts = new Map<string, number>()
  leads.forEach((lead) => {
    if (lead.event_id) {
      eventCounts.set(lead.event_id, (eventCounts.get(lead.event_id) || 0) + 1)
    }
  })
  const leadsByEvent: LeadsByEvent[] = Array.from(eventCounts.entries()).map(([eventId, count]) => ({
    eventId,
    eventName: eventsMap.get(eventId) || 'Unknown Event',
    count,
  })).sort((a, b) => b.count - a.count)

  // Calculate leads by rep (user_id)
  const repCounts = new Map<string, number>()
  leads.forEach((lead) => {
    repCounts.set(lead.user_id, (repCounts.get(lead.user_id) || 0) + 1)
  })
  const leadsByRep: LeadsByRep[] = Array.from(repCounts.entries()).map(([userId, count]) => ({
    userId,
    repName: `Rep ${userId.slice(0, 8)}`, // Placeholder - would need to fetch user names
    count,
  })).sort((a, b) => b.count - a.count)

  // Calculate lead score distribution
  const interestCounts = new Map<string, number>()
  leads.forEach((lead) => {
    const level = lead.interest_level || 'unknown'
    interestCounts.set(level, (interestCounts.get(level) || 0) + 1)
  })
  const leadScoreDistribution: LeadScoreDistribution[] = Array.from(interestCounts.entries()).map(
    ([interestLevel, count]) => ({
      interestLevel,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    })
  )

  // Calculate specialty breakdown from speakers (since leads don't have specialty)
  // We'll use topics_of_interest from leads instead
  const topicCounts = new Map<string, number>()
  leads.forEach((lead) => {
    if (lead.topics_of_interest) {
      lead.topics_of_interest.forEach((topic) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      })
    }
  })
  const specialtyBreakdown: SpecialtyBreakdown[] = Array.from(topicCounts.entries())
    .map(([specialty, count]) => ({ specialty, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Calculate capture trends over time (daily)
  const dateCounts = new Map<string, number>()
  leads.forEach((lead) => {
    const date = lead.created_at.split('T')[0]
    dateCounts.set(date, (dateCounts.get(date) || 0) + 1)
  })
  const captureOverTime: CaptureTimeData[] = Array.from(dateCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate hourly patterns
  const hourCounts = new Map<number, number>()
  leads.forEach((lead) => {
    const hour = new Date(lead.created_at).getHours()
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
  })
  const hourlyPatterns: HourlyPattern[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourCounts.get(hour) || 0,
  }))

  return {
    totalLeads,
    leadsByEvent,
    leadsByRep,
    leadScoreDistribution,
    specialtyBreakdown,
    captureOverTime,
    hourlyPatterns,
  }
}

export interface EventSummaryReport {
  event: Event
  totalLeads: number
  leadsByInterest: LeadScoreDistribution[]
  topReps: LeadsByRep[]
  captureTimeline: CaptureTimeData[]
}

export async function getEventSummaryReport(eventId: string): Promise<EventSummaryReport | null> {
  const supabase = createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    console.error('Error fetching event:', eventError)
    return null
  }

  const analytics = await getAnalyticsData(eventId)

  return {
    event,
    totalLeads: analytics.totalLeads,
    leadsByInterest: analytics.leadScoreDistribution,
    topReps: analytics.leadsByRep.slice(0, 5),
    captureTimeline: analytics.captureOverTime,
  }
}

export interface RepPerformanceReport {
  userId: string
  repName: string
  totalLeads: number
  highInterestLeads: number
  mediumInterestLeads: number
  lowInterestLeads: number
  conversionRate: number
  averageLeadsPerDay: number
  leadsByEvent: LeadsByEvent[]
}

export async function getRepPerformanceReport(userId: string, dateRange?: DateRange): Promise<RepPerformanceReport | null> {
  const supabase = createClient()

  let query = supabase.from('leads').select('*').eq('user_id', userId)

  if (dateRange) {
    query = query
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate)
  }

  const { data: leads, error } = await query

  if (error) {
    console.error('Error fetching rep leads:', error)
    return null
  }

  if (!leads || leads.length === 0) {
    return {
      userId,
      repName: `Rep ${userId.slice(0, 8)}`,
      totalLeads: 0,
      highInterestLeads: 0,
      mediumInterestLeads: 0,
      lowInterestLeads: 0,
      conversionRate: 0,
      averageLeadsPerDay: 0,
      leadsByEvent: [],
    }
  }

  const highInterest = leads.filter((l) => l.interest_level === 'high').length
  const mediumInterest = leads.filter((l) => l.interest_level === 'medium').length
  const lowInterest = leads.filter((l) => l.interest_level === 'low').length

  // Calculate unique days
  const uniqueDays = new Set(leads.map((l) => l.created_at.split('T')[0])).size

  // Get events for leads
  const eventIds = [...new Set(leads.filter((l) => l.event_id).map((l) => l.event_id!))]
  const { data: events } = await supabase.from('events').select('id, name').in('id', eventIds)
  const eventsMap = new Map<string, string>()
  ;(events || []).forEach((e) => eventsMap.set(e.id, e.name))

  // Calculate leads by event for this rep
  const eventCounts = new Map<string, number>()
  leads.forEach((lead) => {
    if (lead.event_id) {
      eventCounts.set(lead.event_id, (eventCounts.get(lead.event_id) || 0) + 1)
    }
  })

  return {
    userId,
    repName: `Rep ${userId.slice(0, 8)}`,
    totalLeads: leads.length,
    highInterestLeads: highInterest,
    mediumInterestLeads: mediumInterest,
    lowInterestLeads: lowInterest,
    conversionRate: Math.round((highInterest / leads.length) * 100),
    averageLeadsPerDay: uniqueDays > 0 ? Math.round(leads.length / uniqueDays) : leads.length,
    leadsByEvent: Array.from(eventCounts.entries()).map(([eventId, count]) => ({
      eventId,
      eventName: eventsMap.get(eventId) || 'Unknown Event',
      count,
    })),
  }
}
