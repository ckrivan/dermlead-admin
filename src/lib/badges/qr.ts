import QRCode from 'qrcode'

export interface QRAttendeeData {
  firstName: string
  lastName: string
  credentials?: string
  email?: string
  phone?: string
  institution?: string
  specialty?: string
  npiNumber?: string
  city?: string
  state?: string
}

export async function generateQRDataURL(data: QRAttendeeData): Promise<string> {
  const payload: Record<string, string> = {
    firstName: data.firstName,
    lastName: data.lastName,
  }

  if (data.credentials) payload.credentials = data.credentials
  if (data.email) payload.email = data.email
  if (data.phone) payload.phone = data.phone
  if (data.institution) payload.institution = data.institution
  if (data.specialty) payload.specialty = data.specialty
  if (data.npiNumber) payload.npiNumber = data.npiNumber
  if (data.city) payload.city = data.city
  if (data.state) payload.state = data.state

  return QRCode.toDataURL(JSON.stringify(payload), {
    margin: 1,
    width: 164, // 4x resolution for crisp 41pt rendering
    errorCorrectionLevel: 'M',
  })
}
