// CSV parsing and generation utilities
// Supports both our format and Whova's export format

export interface SpeakerCSVRow {
  // Our format
  full_name?: string
  credentials?: string
  bio?: string
  specialty?: string
  institution?: string
  email?: string
  linkedin_url?: string
  website_url?: string
  // Whova format (mapped during import)
  name?: string
  '*name'?: string
  first_name?: string
  '*first_name'?: string
  last_name?: string
  '*last_name'?: string
  '*email'?: string
  affiliation?: string
  position?: string
  phone?: string
}

export interface SessionCSVRow {
  // Our format
  title?: string
  description?: string
  session_type?: string
  session_date?: string
  start_time?: string
  end_time?: string
  location?: string
  track?: string
  speaker_names?: string
  // Whova format (mapped during import)
  date?: string
  time_start?: string
  time_end?: string
  tracks?: string
  session_title?: string
  'room/location'?: string
  room_location?: string
  speakers?: string
  authors?: string
  'session/sub-session'?: string
  session_sub_session?: string
  tags?: string
}

export interface GroupCSVRow {
  name: string
  description?: string
  color?: string
}

export interface ExhibitorCSVRow {
  // Our format
  company_name?: string
  description?: string
  booth_number?: string
  website_url?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  category?: string
  // Whova format (mapped during import)
  '*company_name'?: string
  '*contact_first_name'?: string
  contact_first_name?: string
  '*contact_last_name'?: string
  contact_last_name?: string
  '*email'?: string
  email?: string
  website?: string
  tier?: string
  'booth_staff_first_name_1'?: string
  'booth_staff_last_name_1'?: string
  'booth_staff_email_1'?: string
}

export interface SponsorCSVRow {
  // Our format
  company_name?: string
  description?: string
  tier?: string
  website_url?: string
  contact_name?: string
  contact_email?: string
  booth_number?: string
  is_featured?: string
  logo_url?: string
  banner_url?: string
  // Whova format (mapped during import)
  '*company_name'?: string
  '*contact_first_name'?: string
  contact_first_name?: string
  '*contact_last_name'?: string
  contact_last_name?: string
  '*email'?: string
  email?: string
  '*website'?: string
  website?: string
  '*tier'?: string
  featured?: string
}

export function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.split('\n').filter((line) => line.trim())
  if (lines.length < 2) return []

  // Parse header row
  const headers = parseCSVLine(lines[0])

  // Parse data rows
  const data: T[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      const key = header.trim().toLowerCase().replace(/\s+/g, '_')
      row[key] = values[index]?.trim() || ''
    })
    data.push(row as T)
  }

  return data
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result
}

export function generateSpeakerTemplate(): string {
  // Match Whova format: *Name, *First name, *Last name, *Email, Affiliation, Position, Bio, Phone
  const headers = [
    '*Name',
    '*First name',
    '*Last name',
    '*Email',
    'Affiliation',
    'Position',
    'Bio',
    'Phone',
  ]

  const exampleRows = [
    [
      'Dr. Jane Smith, MD',
      'Jane',
      'Smith, MD',
      'jane.smith@example.com',
      'Harvard Medical School',
      'Associate Professor',
      'Leading researcher in dermatology with 20 years of experience.',
      '555-123-4567',
    ],
    [
      'John Doe, PA-C',
      'John',
      'Doe, PA-C',
      'john.doe@example.com',
      'Stanford Dermatology',
      'PA-C',
      'Board-certified physician assistant specializing in medical dermatology.',
      '',
    ],
  ]

  return (
    headers.join(',') +
    '\n' +
    exampleRows.map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
  )
}

export function generateSessionTemplate(): string {
  // Match Whova format: Date, Time Start, Time End, Tracks, Session Title, Room/Location, Description, Speakers, Authors, Session/Sub-session, Tags
  const headers = [
    'Date',
    'Time Start',
    'Time End',
    'Tracks',
    'Session Title',
    'Room/Location',
    'Description',
    'Speakers',
    'Authors',
    'Session/Sub-session',
    'Tags',
  ]

  const exampleRows = [
    [
      '03/15/2026',
      '9:00 AM',
      '10:00 AM',
      'Clinical',
      'Opening Keynote: Future of Dermatology',
      'Main Ballroom',
      'An inspiring look at emerging trends and technologies.',
      'Dr. Jane Smith; Dr. John Doe',
      '',
      'Session',
      'keynote, featured',
    ],
    [
      '03/15/2026',
      '10:30 AM',
      '12:00 PM',
      'Clinical',
      'Advanced Treatment Workshop',
      'Room 101',
      'Hands-on workshop covering latest treatment protocols.',
      'Dr. Jane Smith',
      '',
      'Session',
      'workshop, hands-on',
    ],
    [
      '03/15/2026',
      '12:00 PM',
      '1:00 PM',
      '',
      'Lunch Break',
      'Dining Hall',
      '',
      '',
      '',
      'Session',
      'meal',
    ],
  ]

  return (
    headers.join(',') +
    '\n' +
    exampleRows.map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
  )
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export function generateGroupTemplate(): string {
  const headers = ['name', 'description', 'color']

  const exampleRows = [
    ['Admin', 'Event administrators and organizers', '#ef4444'],
    ['Attendee', 'General event attendees', '#3b82f6'],
    ['Sponsor', 'Event sponsors and exhibitors', '#f59e0b'],
    ['Speaker', 'Speakers and presenters', '#8b5cf6'],
    ['VIP', 'VIP guests and special invitees', '#10b981'],
    ['Press', 'Media and press representatives', '#06b6d4'],
  ]

  return (
    headers.join(',') +
    '\n' +
    exampleRows.map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
  )
}

export function generateExhibitorTemplate(): string {
  // Match Whova format: *Company Name, Booth Number, *Contact First Name, *Contact Last Name, *Email, Description, Website, Tier, Category
  const headers = [
    '*Company Name',
    'Booth Number',
    '*Contact First Name',
    '*Contact Last Name',
    '*Email',
    'Description',
    'Website',
    'Tier',
    'Category',
    'Booth Staff First Name 1',
    'Booth Staff Last Name 1',
    'Booth Staff Email 1',
  ]

  const exampleRows = [
    [
      'Acme Medical Devices',
      'A101',
      'John',
      'Smith',
      'john@acmemedical.com',
      'Leading provider of dermatology equipment and supplies.',
      'https://acmemedical.com',
      'gold',
      'Medical Devices',
      'Sarah',
      'Johnson',
      'sarah@acmemedical.com',
    ],
    [
      'DermTech Solutions',
      'B205',
      'Jane',
      'Doe',
      'jane@dermtech.com',
      'Innovative skincare technology and diagnostic tools.',
      'https://dermtech.com',
      'silver',
      'Technology',
      '',
      '',
      '',
    ],
  ]

  return (
    headers.join(',') +
    '\n' +
    exampleRows.map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
  )
}

export function generateSponsorTemplate(): string {
  const headers = [
    '*Company Name',
    '*Tier',
    'Booth Number',
    'Description',
    '*Contact First Name',
    '*Contact Last Name',
    '*Email',
    'Website',
    'Featured (yes/no)',
    'Logo URL',
    'Banner URL',
  ]

  const exampleRows = [
    [
      'Pfizer Dermatology',
      'Platinum',
      'Main Hall',
      'Global pharmaceutical leader in dermatology treatments.',
      'Sarah',
      'Johnson',
      'sarah.johnson@pfizer.com',
      'https://pfizer.com',
      'yes',
      '',
      '',
    ],
    [
      'SkinCare Research Inc',
      'Gold',
      'C102',
      'Advancing dermatological research and innovation.',
      'Michael',
      'Brown',
      'michael@skincare-research.com',
      'https://skincare-research.com',
      'yes',
      '',
      '',
    ],
    [
      'DermConnect',
      'Silver',
      '',
      'Connecting dermatology professionals worldwide.',
      'Emily',
      'Davis',
      'emily@dermconnect.com',
      'https://dermconnect.com',
      'no',
      '',
      '',
    ],
  ]

  return (
    headers.join(',') +
    '\n' +
    exampleRows.map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
  )
}

// ============================================================================
// Whova format normalization utilities
// ============================================================================

/**
 * Normalize a speaker row from Whova format to our internal format
 */
export function normalizeSpeakerRow(row: SpeakerCSVRow): {
  full_name: string
  credentials: string | null
  bio: string | null
  specialty: string | null
  institution: string | null
  email: string | null
  linkedin_url: string | null
  website_url: string | null
} {
  // Handle Whova format: *name, *first_name, *last_name, *email, affiliation, position, bio, phone
  // Or our format: full_name, credentials, bio, specialty, institution, email, linkedin_url, website_url

  const whovaName = row['*name'] || row.name
  const whovaFirstName = row['*first_name'] || row.first_name
  const whovaLastName = row['*last_name'] || row.last_name
  const whovaEmail = row['*email'] || row.email

  // Determine full_name
  let fullName = row.full_name || whovaName || ''
  if (!fullName && whovaFirstName && whovaLastName) {
    fullName = `${whovaFirstName} ${whovaLastName}`.trim()
  }

  // Extract credentials from position or last_name (Whova puts credentials in last name sometimes)
  let credentials = row.credentials || row.position || null
  if (!credentials && whovaLastName) {
    // Check if last name contains credentials like "Smith, MD" or "Doe, PA-C"
    const match = whovaLastName.match(/,\s*(.+)$/)
    if (match) {
      credentials = match[1].trim()
    }
  }

  return {
    full_name: fullName.trim(),
    credentials: credentials?.trim() || null,
    bio: row.bio?.trim() || null,
    specialty: row.specialty?.trim() || null,
    institution: row.affiliation?.trim() || row.institution?.trim() || null,
    email: whovaEmail?.trim()?.toLowerCase() || null,
    linkedin_url: row.linkedin_url?.trim() || null,
    website_url: row.website_url?.trim() || null,
  }
}

/**
 * Normalize a session row from Whova format to our internal format
 */
export function normalizeSessionRow(row: SessionCSVRow): {
  title: string
  description: string | null
  session_type: string
  session_date: string
  start_time: string
  end_time: string
  location: string | null
  track: string | null
  speaker_names: string | null
} {
  // Whova format: date, time_start, time_end, tracks, session_title, room/location, description, speakers, authors, session/sub-session, tags
  // Our format: title, description, session_type, session_date, start_time, end_time, location, track, speaker_names

  const title = row.session_title || row.title || ''
  const description = row.description || null
  const location = row['room/location'] || row.room_location || row.location || null
  const track = row.tracks || row.track || null
  const speakerNames = row.speakers || row.speaker_names || null

  // Parse date - Whova uses MM/DD/YYYY, we use YYYY-MM-DD
  let sessionDate = row.session_date || ''
  if (row.date) {
    const dateParts = row.date.split('/')
    if (dateParts.length === 3) {
      const [month, day, year] = dateParts
      sessionDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    } else {
      sessionDate = row.date
    }
  }

  // Parse time - Whova uses "9:00 AM", we use "09:00"
  const startTime = row.start_time || parseWhovaTime(row.time_start || '') || ''
  const endTime = row.end_time || parseWhovaTime(row.time_end || '') || ''

  // Determine session type from tags or session/sub-session
  let sessionType = row.session_type || 'session'
  const tags = row.tags?.toLowerCase() || ''
  const sessionSubSession = row['session/sub-session'] || row.session_sub_session || ''

  if (tags.includes('keynote')) sessionType = 'keynote'
  else if (tags.includes('workshop')) sessionType = 'workshop'
  else if (tags.includes('panel')) sessionType = 'panel'
  else if (tags.includes('meal') || tags.includes('lunch') || tags.includes('breakfast') || tags.includes('dinner'))
    sessionType = 'meal'
  else if (tags.includes('break') || tags.includes('networking')) sessionType = 'break'
  else if (tags.includes('poster')) sessionType = 'poster'
  else if (sessionSubSession?.toLowerCase() === 'sub-session') sessionType = 'session'

  return {
    title: title.trim(),
    description: description?.trim() || null,
    session_type: sessionType,
    session_date: sessionDate,
    start_time: startTime,
    end_time: endTime,
    location: location?.trim() || null,
    track: track?.trim() || null,
    speaker_names: speakerNames?.replace(/;/g, ',').trim() || null, // Whova uses ; as separator
  }
}

/**
 * Convert Whova time format (e.g., "9:00 AM", "12:30 PM") to 24-hour format (e.g., "09:00", "12:30")
 */
function parseWhovaTime(timeStr: string): string {
  if (!timeStr) return ''

  // Already in 24-hour format
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':')
    return `${h.padStart(2, '0')}:${m}`
  }

  // Parse AM/PM format
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return timeStr

  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const period = match[3].toUpperCase()

  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`
}

/**
 * Normalize an exhibitor row from Whova format to our internal format
 */
export function normalizeExhibitorRow(row: ExhibitorCSVRow): {
  company_name: string
  description: string | null
  booth_number: string | null
  website_url: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  category: string | null
} {
  const companyName = row['*company_name'] || row.company_name || ''
  const firstName = row['*contact_first_name'] || row.contact_first_name || ''
  const lastName = row['*contact_last_name'] || row.contact_last_name || ''
  const email = row['*email'] || row.email || row.contact_email || ''

  let contactName = row.contact_name || ''
  if (!contactName && (firstName || lastName)) {
    contactName = `${firstName} ${lastName}`.trim()
  }

  return {
    company_name: companyName.trim(),
    description: row.description?.trim() || null,
    booth_number: row.booth_number?.trim() || null,
    website_url: row.website?.trim() || row.website_url?.trim() || null,
    contact_name: contactName || null,
    contact_email: email?.trim()?.toLowerCase() || null,
    contact_phone: row.contact_phone?.trim() || null,
    category: row.category?.trim() || null,
  }
}

/**
 * Normalize a sponsor row from Whova format to our internal format
 */
export function normalizeSponsorRow(row: SponsorCSVRow): {
  company_name: string
  description: string | null
  tier: string
  website_url: string | null
  contact_name: string | null
  contact_email: string | null
  booth_number: string | null
  is_featured: boolean
  logo_url: string | null
  banner_url: string | null
} {
  const companyName = row['*company_name'] || row.company_name || ''
  const firstName = row['*contact_first_name'] || row.contact_first_name || ''
  const lastName = row['*contact_last_name'] || row.contact_last_name || ''
  const email = row['*email'] || row.email || row.contact_email || ''
  const website = row['*website'] || row.website || row.website_url || ''
  const tier = row['*tier'] || row.tier || 'partner'

  let contactName = row.contact_name || ''
  if (!contactName && (firstName || lastName)) {
    contactName = `${firstName} ${lastName}`.trim()
  }

  // Normalize tier to lowercase
  const normalizedTier = tier.toLowerCase().trim()
  const validTiers = ['platinum', 'gold', 'silver', 'bronze', 'partner']
  const finalTier = validTiers.includes(normalizedTier) ? normalizedTier : 'partner'

  // is_featured: explicit CSV value takes precedence, otherwise auto-set for platinum/gold
  const featuredRaw = (row.is_featured || row.featured || (row as Record<string, string | undefined>)['featured_(yes/no)'] || '').toLowerCase().trim()
  const isFeatured = featuredRaw
    ? featuredRaw === 'yes' || featuredRaw === 'true' || featuredRaw === '1'
    : finalTier === 'platinum' || finalTier === 'gold'

  return {
    company_name: companyName.trim(),
    description: row.description?.trim() || null,
    tier: finalTier,
    website_url: website?.trim() || null,
    contact_name: contactName || null,
    contact_email: email?.trim()?.toLowerCase() || null,
    booth_number: row.booth_number?.trim() || null,
    is_featured: isFeatured,
    logo_url: row.logo_url?.trim() || null,
    banner_url: row.banner_url?.trim() || null,
  }
}
