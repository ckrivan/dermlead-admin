export default function DeleteAccountPage() {
  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Delete Your Account</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Converge Capture — Account Deletion</p>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>How to delete your account</h2>
      <ol style={{ lineHeight: 1.8, marginBottom: 32 }}>
        <li>Open the <strong>Converge Capture</strong> app on your device</li>
        <li>Tap the <strong>Profile</strong> tab at the bottom of the screen</li>
        <li>Scroll down and tap <strong>Delete Account</strong></li>
        <li>Confirm the deletion when prompted</li>
      </ol>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>What gets deleted</h2>
      <ul style={{ lineHeight: 1.8, marginBottom: 32 }}>
        <li>Your user profile and login credentials</li>
        <li>Your messages and community posts</li>
        <li>Your agenda selections and session bookmarks</li>
        <li>Your event registrations and attendee records</li>
        <li>Your push notification preferences and tokens</li>
      </ul>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>What may be retained</h2>
      <ul style={{ lineHeight: 1.8, marginBottom: 32 }}>
        <li>Lead capture records may be retained by the organization that collected them, as they are business records belonging to that organization</li>
        <li>Anonymized analytics data that cannot be linked back to your account</li>
      </ul>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Need help?</h2>
      <p style={{ lineHeight: 1.8 }}>
        If you are unable to access the app or need assistance deleting your account,
        contact us at <a href="mailto:support@convergecapture.com" style={{ color: '#2563EB' }}>support@convergecapture.com</a>.
        Deletion requests are processed within 30 days.
      </p>
    </div>
  )
}
