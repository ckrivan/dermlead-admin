import jsPDF from 'jspdf'
import { generateQRDataURL } from './qr'
import type { BadgeTemplateConfig } from '@/types/database'
import {
  BADGE_W,
  BADGE_H,
  TOP_MARGIN,
  COL_X,
  BADGES_PER_PAGE,
  PAD,
  IDF_BLUE,
  BAR_OUTLINE,
  TEXT_DARK,
  TEXT_MEDIUM,
  WHITE,
  FONT_FAMILY,
  TITLE_SIZE,
  NAME_SIZE,
  NAME_MIN_SIZE,
  LOCATION_SIZE,
  BAR_TEXT_SIZE,
  LOGO_X,
  LOGO_Y,
  LOGO_W,
  LOGO_H,
  TITLE_X,
  TITLE_Y1,
  TITLE_Y2,
  RULE_Y,
  RULE_H,
  NAME_Y,
  BAR_H,
  QR_SIZE,
  QR_Y_OFFSET,
  EVENT_TITLE_LINE1,
  EVENT_TITLE_LINE2,
  BADGE_TYPE_LABELS,
  STATE_MAP,
} from './constants'

export interface BadgeAttendee {
  id: string
  first_name: string
  last_name: string
  credentials: string | null
  city: string | null
  state: string | null
  badge_type: string
  email: string
  phone: string | null
  institution: string | null
  specialty: string | null
  npi_number: string | null
}

function normalizeState(state: string): string {
  return STATE_MAP[state] || state
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

function getLocation(attendee: BadgeAttendee): string {
  const city = attendee.city ? titleCase(attendee.city) : ''
  const state = attendee.state ? normalizeState(attendee.state) : ''
  if (city && state) return `${city}, ${state}`
  return city || state || ''
}

function getBadgeName(attendee: BadgeAttendee): string {
  const name = `${attendee.first_name} ${attendee.last_name}`.trim()
  const creds = (attendee.credentials || '').trim()
  if (creds && !['student', 'none', 'n/a', ''].includes(creds.toLowerCase())) {
    return `${name}, ${creds}`
  }
  if (creds.toLowerCase() === 'student') {
    return `${name}, Student`
  }
  return name
}

async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Resolve template values with fallbacks to hard-coded defaults
function getTemplateValues(template?: BadgeTemplateConfig | null) {
  return {
    titleLines: template?.eventTitle ?? [EVENT_TITLE_LINE1, EVENT_TITLE_LINE2],
    barColor: template?.barColor ?? IDF_BLUE,
    barOutline: template?.barOutlineColor ?? BAR_OUTLINE,
    barH: template?.barHeight ?? BAR_H,
    ruleColor: template?.ruleColor ?? IDF_BLUE,
    ruleH: template?.ruleHeight ?? RULE_H,
    logoPos: template?.logoPosition ?? { x: LOGO_X, y: LOGO_Y, w: LOGO_W, h: LOGO_H },
    barLabel: template?.barLabel ?? null,
  }
}

function drawBadge(
  doc: jsPDF,
  x: number,
  yTop: number,
  attendee: BadgeAttendee,
  logoBase64: string,
  qrDataURL: string,
  tv: ReturnType<typeof getTemplateValues>
) {
  const cx = x + BADGE_W / 2

  // ── Logo (top-left, with padding) ──
  try {
    doc.addImage(logoBase64, 'PNG', x + tv.logoPos.x, yTop + tv.logoPos.y, tv.logoPos.w, tv.logoPos.h)
  } catch {
    // logo load failed
  }

  // ── Event Title (bold, to the right of logo) ──
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(TITLE_SIZE)
  doc.setTextColor(TEXT_DARK)
  const titleX = x + TITLE_X
  doc.text(tv.titleLines[0] || '', titleX, yTop + TITLE_Y1)
  if (tv.titleLines[1]) {
    doc.text(tv.titleLines[1], titleX, yTop + TITLE_Y2)
  }

  // ── Blue Rule (below logo+title, with padding) ──
  doc.setFillColor(tv.ruleColor)
  doc.rect(x, yTop + RULE_Y, BADGE_W, tv.ruleH, 'F')

  // ── Name (centered, auto-shrink) ──
  const badgeName = getBadgeName(attendee)
  let nameSize = NAME_SIZE
  doc.setFont(FONT_FAMILY, 'normal')
  doc.setFontSize(nameSize)
  let nameW = doc.getTextWidth(badgeName)
  const maxW = BADGE_W - 2 * PAD

  if (nameW > maxW) {
    nameSize = Math.max(NAME_MIN_SIZE, nameSize * (maxW / nameW))
    doc.setFontSize(nameSize)
    nameW = doc.getTextWidth(badgeName)
  }

  doc.setTextColor(TEXT_DARK)
  doc.text(badgeName, cx - nameW / 2, yTop + NAME_Y)

  // ── City, State (centered) ──
  const location = getLocation(attendee)
  if (location) {
    doc.setFont(FONT_FAMILY, 'normal')
    doc.setFontSize(LOCATION_SIZE)
    doc.setTextColor(TEXT_MEDIUM)
    const locW = doc.getTextWidth(location)
    doc.text(location, cx - locW / 2, yTop + 136)
  }

  // ── ATTENDEE Bar (bottom, with padding + outline) ──
  const barYPos = yTop + BADGE_H - tv.barH - 2
  const barX = x
  const barW = BADGE_W
  doc.setFillColor(tv.barColor)
  doc.rect(barX, barYPos, barW, tv.barH, 'F')
  doc.setDrawColor(tv.barOutline)
  doc.setLineWidth(1)
  doc.rect(barX, barYPos, barW, tv.barH, 'S')

  const barLabel = tv.barLabel || BADGE_TYPE_LABELS[attendee.badge_type] || 'ATTENDEE'
  doc.setFont(FONT_FAMILY, 'normal')
  doc.setFontSize(BAR_TEXT_SIZE)
  doc.setTextColor(WHITE)
  const barLabelW = doc.getTextWidth(barLabel)
  doc.text(barLabel, cx - barLabelW / 2, barYPos + tv.barH / 2 + BAR_TEXT_SIZE * 0.3)

  // ── QR Code (centered horizontally, above bar) ──
  const qrX = x + BADGE_W - QR_SIZE - 10
  const qrY = yTop + QR_Y_OFFSET
  try {
    doc.addImage(qrDataURL, 'PNG', qrX, qrY, QR_SIZE, QR_SIZE)
  } catch {
    // QR generation failed
  }
}

export async function generateBadgePDF(
  attendees: BadgeAttendee[],
  onProgress?: (current: number, total: number) => void,
  template?: BadgeTemplateConfig | null
): Promise<void> {
  if (attendees.length === 0) return

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  })

  const tv = getTemplateValues(template)

  // Pre-load logo
  let logoBase64 = ''
  const logoUrl = template?.logoUrl || '/images/idf-logo.png'
  try {
    logoBase64 = await loadImageAsBase64(logoUrl)
  } catch {
    console.warn('Could not load logo from', logoUrl)
    try {
      logoBase64 = await loadImageAsBase64('/images/idf-logo.png')
    } catch {
      console.warn('Could not load fallback logo either')
    }
  }

  // Pre-generate all QR codes
  const qrCodes: string[] = []
  const BATCH_SIZE = 20
  for (let i = 0; i < attendees.length; i += BATCH_SIZE) {
    const batch = attendees.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map((a) =>
        generateQRDataURL({
          firstName: a.first_name,
          lastName: a.last_name,
          credentials: a.credentials || undefined,
          institution: a.institution || undefined,
          specialty: a.specialty || undefined,
          npiNumber: a.npi_number || undefined,
          city: a.city || undefined,
          state: a.state || undefined,
        })
      )
    )
    qrCodes.push(...results)
    onProgress?.(Math.min(i + BATCH_SIZE, attendees.length), attendees.length)
  }

  // Generate pages: 6 unique attendees per sheet, front + back (column-flipped) for duplex
  const totalSheets = Math.ceil(attendees.length / BADGES_PER_PAGE)

  for (let sheetIdx = 0; sheetIdx < totalSheets; sheetIdx++) {
    if (sheetIdx > 0) doc.addPage()

    const startIdx = sheetIdx * BADGES_PER_PAGE
    const batch = attendees.slice(startIdx, startIdx + BADGES_PER_PAGE)

    // ─── FRONT PAGE ───
    for (let idx = 0; idx < batch.length; idx++) {
      const rowIdx = Math.floor(idx / 2)
      const colIdx = idx % 2
      const colX = COL_X[colIdx]
      const yTop = TOP_MARGIN + rowIdx * BADGE_H
      drawBadge(doc, colX, yTop, batch[idx], logoBase64, qrCodes[startIdx + idx], tv)
    }

    // ─── BACK PAGE (columns flipped for duplex alignment) ───
    doc.addPage()
    for (let idx = 0; idx < batch.length; idx++) {
      const rowIdx = Math.floor(idx / 2)
      const colIdx = 1 - (idx % 2) // FLIPPED
      const colX = COL_X[colIdx]
      const yTop = TOP_MARGIN + rowIdx * BADGE_H
      drawBadge(doc, colX, yTop, batch[idx], logoBase64, qrCodes[startIdx + idx], tv)
    }
  }

  const fileName = tv.titleLines.join('-').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '-badges.pdf'
  doc.save(fileName)
}
