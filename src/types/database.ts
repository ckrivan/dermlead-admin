// Database types matching Supabase schema

export interface Organization {
  id: string;
  name: string;
  subscription_tier: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: "admin" | "rep" | "attendee" | "auditor";
  organization_id: string | null;
  is_active: boolean;
  credentials: string | null;
  bio: string | null;
  specialty: string | null;
  institution: string | null;
  title: string | null;
  is_speaker: boolean;
  city: string | null;
  state: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  contact_shared: boolean;
  personal_email: string | null;
  invited_by?: string | null;
  invited_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  organization_id: string;
  name: string;
  slug?: string;
  location: string | null;
  start_date: string;
  end_date: string;
  invite_code: string | null;
  description: string | null;
  banner_url: string | null;
  interest_options?: string[] | null;
  website_url?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  // Branding fields
  brand_color?: string | null;
  primary_color?: string | null;
  logo_url: string | null;
  show_logo_on_banner: boolean | null;
  custom_url_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface Speaker {
  id: string;
  event_id: string;
  full_name: string;
  credentials: string | null;
  bio: string | null;
  specialty: string | null;
  institution: string | null;
  photo_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  website_url?: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  session_type: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  location_details?: string | null;
  track: string | null;
  objectives: string[] | null;
  capacity?: number | null;
  requires_registration?: boolean;
  is_highlighted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionSpeaker {
  id: string;
  session_id: string;
  speaker_id: string;
  role: string;
  display_order: number;
}

export interface Attendee {
  id: string;
  event_id: string;
  organization_id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  institution: string | null;
  title: string | null;
  credentials: string | null;
  npi_number: string | null;
  street_address: string | null;
  street_address_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  badge_type: string;
  badge_generated: boolean;
  badge_printed: boolean;
  qr_data: Record<string, unknown> | null;
  registered_at: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  event_id: string | null;
  captured_by: string;
  first_name: string;
  last_name: string;
  work_email: string;
  personal_email: string | null;
  phone: string | null;
  specialty: string;
  institution: string | null;
  years_in_practice: string | null;
  interest_areas: string[] | null;
  notes: string | null;
  lead_score: number;
  photo_url: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// Renamed from AttendeeGroup - now supports all entity types
export interface EventGroup {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
}

// Alias for backward compatibility
export type AttendeeGroup = EventGroup;

export type EntityType = "attendee" | "speaker" | "sponsor" | "exhibitor";

export interface GroupMember {
  id: string;
  group_id: string;
  entity_type: EntityType;
  entity_id: string;
  created_at: string;
}

// Legacy alias — maps to group_members table (entity_id column)
export interface AttendeeGroupMember {
  id: string;
  group_id: string;
  entity_id: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  event_id: string;
  title: string;
  message: string;
  target_groups: string[] | null; // null means all attendees
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exhibitor {
  id: string;
  event_id: string;
  company_name: string;
  description: string | null;
  booth_number: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website_url?: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  category: string | null;
  products_services: string[] | null;
  social_links: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  event_id: string;
  company_name: string;
  description: string | null;
  tier: "title_sponsor" | "presidents_circle" | "bronze" | "exhibitor" | "exhibitor";
  logo_url: string | null;
  banner_url: string | null;
  website_url?: string | null;
  contact_name: string | null;
  contact_email: string | null;
  booth_number: string | null;
  display_order: number;
  is_featured: boolean;
  social_links: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface SpeakerMessage {
  id: string;
  event_id: string;
  speaker_id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  read_at: string | null;
  replied_at: string | null;
  created_at: string;
}
