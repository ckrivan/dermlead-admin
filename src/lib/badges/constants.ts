// Avery 74459 badge layout constants
// Synced with Python script: tools/generate_idf_badges_v2.py
// All values in points

export const PAGE_W = 612 // US Letter width
export const PAGE_H = 792 // US Letter height

export const BADGE_W = 288 // 4" badge width
export const BADGE_H = 216 // 3" badge height

export const LEFT_MARGIN = 18
export const TOP_MARGIN = 72

// Columns touch at the fold (no gap)
export const COL_X = [LEFT_MARGIN, LEFT_MARGIN + BADGE_W] // [18, 306]

export const BADGES_PER_PAGE = 6 // 3 rows x 2 columns
export const ROWS_PER_PAGE = 3

// Inner padding from badge cell edge
export const PAD = 10

// Colors from Avery template
export const IDF_BLUE = '#64B0D2'
export const BAR_OUTLINE = '#3D4A76'
export const TEXT_DARK = '#222222'
export const TEXT_MEDIUM = '#444444'
export const WHITE = '#FFFFFF'

// Typography
export const FONT_FAMILY = 'helvetica'
export const TITLE_SIZE = 20
export const NAME_SIZE = 22
export const NAME_MIN_SIZE = 12
export const LOCATION_SIZE = 20
export const BAR_TEXT_SIZE = 22

// Layout: Logo+Title (top) → Rule → Name → City/State → QR (centered) → ATTENDEE bar (bottom)

// Logo (top-left, with padding)
export const LOGO_X = 10 // PAD
export const LOGO_Y = 14 // offset from badge top
export const LOGO_W = 55
export const LOGO_H = 58

// Event title (to the right of logo)
export const TITLE_X = 73 // PAD + LOGO_W + 8
export const TITLE_Y1 = 30 // line 1 offset from badge top
export const TITLE_Y2 = 52 // line 2 offset from badge top

// Blue rule (below logo+title header)
export const RULE_Y = 82
export const RULE_H = 6.7

// Name
export const NAME_Y = 112

// QR code (centered horizontally)
export const QR_SIZE = 36
export const QR_Y_OFFSET = 143 // from badge top (must clear bar at y=184)
// Legacy exports for template compatibility
export const QR_MARGIN_RIGHT = 0

// ATTENDEE bar (bottom)
export const BAR_Y = -1 // calculated as BADGE_H - 2 from top
export const BAR_H = 30

// Event info
export const EVENT_TITLE_LINE1 = 'IDF Skin Science &'
export const EVENT_TITLE_LINE2 = 'Innovation Summit'

// Badge type labels for the bottom bar
export const BADGE_TYPE_LABELS: Record<string, string> = {
  attendee: 'ATTENDEE',
  speaker: 'SPEAKER',
  industry: 'INDUSTRY',
  exhibitor: 'EXHIBITOR',
  sponsor: 'SPONSOR',
  leadership: 'LEADERSHIP',
  organiser: 'ORGANISER',
}

// State abbreviation normalization
export const STATE_MAP: Record<string, string> = {
  florida: 'FL',
  Florida: 'FL',
  Fl: 'FL',
  fl: 'FL',
  Illinois: 'IL',
  illinois: 'IL',
  Michigan: 'MI',
  michigan: 'MI',
  indiana: 'IN',
  Indiana: 'IN',
}
