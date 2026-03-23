import QRCode from 'qrcode'

export interface QRAttendeeData {
  attendeeId: string
}

export async function generateQRDataURL(data: QRAttendeeData): Promise<string> {
  const payload = {
    attendeeId: data.attendeeId,
  }

  return QRCode.toDataURL(JSON.stringify(payload), {
    margin: 1,
    width: 164, // 4x resolution for crisp 41pt rendering
    errorCorrectionLevel: 'M',
  })
}
