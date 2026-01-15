// Database types matching Supabase schema

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Event {
  id: string
  organization_id: string
  name: string
  slug: string
  location: string | null
  start_date: string
  end_date: string
  invite_code: string | null
  description: string | null
  banner_url: string | null
  tracks: string[] | null
  // Branding fields
  brand_color: string | null
  logo_url: string | null
  show_logo_on_banner: boolean | null
  custom_url_slug: string | null
  created_at: string
  updated_at: string
}

export interface Speaker {
  id: string
  event_id: string
  full_name: string
  credentials: string | null
  bio: string | null
  specialty: string | null
  institution: string | null
  photo_url: string | null
  email: string | null
  linkedin_url: string | null
  website_url: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  event_id: string
  title: string
  description: string | null
  session_type: string
  session_date: string
  start_time: string
  end_time: string
  location: string | null
  track: string | null
  learning_objectives: string[] | null
  created_at: string
  updated_at: string
}

export interface SessionSpeaker {
  id: string
  session_id: string
  speaker_id: string
  role: string
  display_order: number
}

export interface Attendee {
  id: string
  event_id: string
  organization_id: string
  profile_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  specialty: string | null
  institution: string | null
  title: string | null
  badge_type: string
  badge_generated: boolean
  badge_printed: boolean
  qr_data: Record<string, unknown> | null
  registered_at: string | null
  checked_in: boolean
  checked_in_at: string | null
  checked_in_by: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  organization_id: string
  user_id: string
  event_id: string | null
  full_name: string
  email: string | null
  company: string | null
  title: string | null
  phone: string | null
  notes: string | null
  interest_level: string
  topics_of_interest: string[] | null
  created_at: string
  updated_at: string
}

export interface AttendeeGroup {
  id: string
  event_id: string
  name: string
  description: string | null
  color: string | null
  created_at: string
}

export interface AttendeeGroupMember {
  id: string
  group_id: string
  attendee_id: string
  created_at: string
}

export interface Announcement {
  id: string
  event_id: string
  title: string
  message: string
  target_groups: string[] | null // null means all attendees
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface Exhibitor {
  id: string
  event_id: string
  company_name: string
  description: string | null
  booth_number: string | null
  logo_url: string | null
  banner_url: string | null
  website_url: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  category: string | null
  products_services: string[] | null
  social_links: Record<string, string> | null
  created_at: string
  updated_at: string
}

export interface Sponsor {
  id: string
  event_id: string
  company_name: string
  description: string | null
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner'
  logo_url: string | null
  banner_url: string | null
  website_url: string | null
  contact_name: string | null
  contact_email: string | null
  booth_number: string | null
  display_order: number
  is_featured: boolean
  social_links: Record<string, string> | null
  created_at: string
  updated_at: string
}

export interface SpeakerMessage {
  id: string
  event_id: string
  speaker_id: string
  sender_name: string
  sender_email: string
  subject: string
  message: string
  read_at: string | null
  replied_at: string | null
  created_at: string
}
