import JSZip from 'jszip'
import type { BadgeTemplateConfig } from '@/types/database'

function hexColorToCSS(averyColor: string): string {
  // Avery uses "0x64b0d2" format, convert to "#64B0D2"
  return '#' + averyColor.replace('0x', '').replace('#', '').toUpperCase()
}

function twipsToPts(twips: number): number {
  return twips / 20
}

interface ParseResult {
  config: Omit<BadgeTemplateConfig, 'logoUrl'>
  logoBlob: Blob | null
  logoFilename: string | null
}

export async function parseAveryFile(file: File): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(file)

  // Find the main XML (not the mmd- prefixed mail merge data file)
  let mainXmlName: string | null = null
  let logoFilename: string | null = null

  zip.forEach((relativePath) => {
    if (relativePath.endsWith('.xml') && !relativePath.startsWith('mmd-')) {
      mainXmlName = relativePath
    }
  })

  if (!mainXmlName) {
    throw new Error('No template XML found in .avery file')
  }

  const xmlContent = await zip.file(mainXmlName)!.async('string')
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlContent, 'text/xml')

  // Extract colors from drawings (polygons = bars and rules)
  const drawings = doc.querySelectorAll('drawing')
  let barColor = '#64B0D2'
  let barOutlineColor = '#3D4A76'
  let ruleColor = '#64B0D2'
  let barHeight = 32
  let ruleHeight = 6.7

  for (const drawing of drawings) {
    const color = drawing.getAttribute('color')
    const height = parseFloat(drawing.getAttribute('height') || '0')
    const outlineEl = drawing.querySelector('outline')
    const outlineColor = outlineEl?.getAttribute('color')

    if (color && height > 0) {
      const ptHeight = twipsToPts(height)
      if (ptHeight > 20) {
        // This is the bar (thick rectangle)
        barColor = hexColorToCSS(color)
        barHeight = ptHeight
        if (outlineColor) barOutlineColor = hexColorToCSS(outlineColor)
      } else if (ptHeight < 15) {
        // This is the thin rule
        ruleColor = hexColorToCSS(color)
        ruleHeight = ptHeight
      }
    }
  }

  // Extract text blocks to find event title and bar label
  const textBlocks = doc.querySelectorAll('textBlock')
  const titleLines: string[] = []
  let barLabel = 'ATTENDEE'

  for (const tb of textBlocks) {
    const spans = tb.querySelectorAll('span')
    for (const span of spans) {
      const text = (span.textContent || '').trim()
      if (!text) continue

      const fontWeight = span.getAttribute('fontWeight')
      const color = span.getAttribute('color')

      // White text on teal bar = bar label
      if (color === '#ffffff' || color === '#FFFFFF') {
        barLabel = text.toUpperCase()
      }
      // Bold text = likely event title
      else if (fontWeight === 'bold' && text.length > 3 &&
               !text.includes('Name') && !text.includes('City') && !text.includes('TYPE')) {
        if (!titleLines.includes(text)) {
          titleLines.push(text)
        }
      }
    }
  }

  // Extract image (logo)
  const images = doc.querySelectorAll('image')
  let logoBlob: Blob | null = null
  let logoPosition = { x: 17, y: 11.5, w: 43.3, h: 45.5 }

  for (const img of images) {
    const source = img.getAttribute('source')
    if (source) {
      logoFilename = source
      const posEl = img.querySelector('position')
      const x = parseFloat(posEl?.getAttribute('x') || '0')
      const y = parseFloat(posEl?.getAttribute('y') || '0')
      const w = parseFloat(img.getAttribute('width') || '0')
      const h = parseFloat(img.getAttribute('height') || '0')

      logoPosition = {
        x: twipsToPts(x),
        y: twipsToPts(y),
        w: twipsToPts(w),
        h: twipsToPts(h),
      }

      // Load the image from the ZIP
      const imgFile = zip.file(source)
      if (imgFile) {
        const imgData = await imgFile.async('blob')
        logoBlob = imgData
      }
      break
    }
  }

  // Clean up title lines (remove leading/trailing spaces from Avery)
  const cleanTitle = titleLines.map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean)

  return {
    config: {
      eventTitle: cleanTitle.length > 0 ? cleanTitle : ['Event Name'],
      barColor,
      barOutlineColor,
      barHeight,
      ruleColor,
      ruleHeight,
      logoPosition,
      barLabel,
    },
    logoBlob,
    logoFilename,
  }
}
