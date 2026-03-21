export const metadata = {
  title: 'Privacy Policy - Converge Connect',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 20, 2026</p>

      <p className="mb-6">
        BCI Management Group, LLC (&ldquo;BCI,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the
        Converge Connect mobile application (the &ldquo;App&rdquo;). This Privacy Policy explains what information we collect,
        how we use it, and your choices regarding your data.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>

      <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
      <p className="mb-4">
        When you create an account, we collect your name, email address, and password. You may optionally provide
        your phone number, institution or practice name, specialty, credentials, city, state, bio, and social media
        links (LinkedIn, Instagram). You choose what to share through privacy controls in the App&rsquo;s Settings.
      </p>

      <h3 className="text-lg font-medium mt-4 mb-2">Event &amp; Attendance Data</h3>
      <p className="mb-4">
        When you join an event, we store your registration, check-in status, and badge type (e.g., attendee, speaker,
        staff). This data is provided by event organizers and linked to your account when you register.
      </p>

      <h3 className="text-lg font-medium mt-4 mb-2">Lead Retrieval Data</h3>
      <p className="mb-4">
        If you participate in lead retrieval (scanning attendee badges), the scanned data — including name, credentials,
        specialty, institution, city, state, and NPI number — is stored as a lead record associated with your account
        and the event. Lead data is only accessible to authorized staff and the capturing organization.
      </p>

      <h3 className="text-lg font-medium mt-4 mb-2">User-Generated Content</h3>
      <p className="mb-4">
        Posts, comments, questions, and messages you create within the App are stored on our servers. Direct messages
        are only visible to conversation participants. Community posts are visible to other event attendees.
      </p>

      <h3 className="text-lg font-medium mt-4 mb-2">Photos</h3>
      <p className="mb-4">
        If you upload photos to the App (profile pictures, event photos, or message attachments), they are stored
        in our cloud storage. Event photos may be tagged with the names of people in them.
      </p>

      <h3 className="text-lg font-medium mt-4 mb-2">Device Information</h3>
      <p className="mb-4">
        We collect your device&rsquo;s push notification token (via Firebase Cloud Messaging) to send you notifications
        about messages, announcements, and session reminders. You can disable notifications in the App&rsquo;s Settings
        or your device settings at any time.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. How We Use Your Information</h2>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>To provide and maintain the App&rsquo;s features (event management, messaging, lead retrieval, session agendas)</li>
        <li>To display your profile to other event attendees, subject to your privacy settings</li>
        <li>To send push notifications you have opted into (messages, announcements, session reminders)</li>
        <li>To enable event organizers to manage attendees, check-ins, and lead retrieval</li>
        <li>To generate aggregated analytics for event organizers (no personally identifiable information is shared in analytics)</li>
        <li>To respond to your feedback, support requests, or reports of inappropriate content</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. Information Sharing</h2>
      <p className="mb-4">
        We do not sell your personal information. We share data only in these circumstances:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li><strong>Event organizers:</strong> Your name, credentials, badge type, and check-in status are visible to the event organizer.</li>
        <li><strong>Lead retrieval:</strong> If your badge is scanned by an authorized lead retrieval user, the data encoded in your badge QR code is shared with that user&rsquo;s organization. You can control what data appears by adjusting your privacy settings.</li>
        <li><strong>Other attendees:</strong> Your name and credentials are visible in the attendee directory. Other profile details (email, phone, institution, specialty, bio, social links) are only shown if you enable them in your privacy settings.</li>
        <li><strong>Service providers:</strong> We use Supabase (database and authentication, hosted on AWS), Firebase (push notifications), and Vercel (web hosting) to operate the App. These providers process data on our behalf under their respective privacy policies.</li>
        <li><strong>Legal requirements:</strong> We may disclose information if required by law or to protect the rights, safety, or property of BCI, our users, or the public.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. Your Privacy Controls</h2>
      <p className="mb-4">
        The App provides granular privacy controls in Settings. You can individually toggle the visibility of:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Email address (hidden by default)</li>
        <li>Phone number (hidden by default)</li>
        <li>Institution / practice name</li>
        <li>Specialty</li>
        <li>Bio</li>
        <li>LinkedIn profile</li>
        <li>Instagram profile</li>
        <li>City and state</li>
      </ul>
      <p className="mb-4">
        You can also set your entire profile to private, which hides all information except your name.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">5. Data Retention</h2>
      <p className="mb-4">
        We retain your account data for as long as your account is active. Lead retrieval data is retained for the
        duration specified by the event organizer (typically 14 days after the event ends), after which access expires.
        Event data (sessions, speakers, sponsors) is retained for historical reference.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. Account Deletion</h2>
      <p className="mb-4">
        You can delete your account at any time from the App&rsquo;s Settings. Account deletion permanently removes
        your profile, personal data, and messages. Lead records you captured are retained but anonymized
        (your identity as the capturer is removed). To request deletion, you can also contact us at{' '}
        <a href="mailto:support@bcimgt.com" className="text-blue-600 underline">support@bcimgt.com</a>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">7. Data Security</h2>
      <p className="mb-4">
        We use industry-standard security measures including encrypted connections (HTTPS/TLS), secure authentication
        (Supabase Auth with JWT tokens), and row-level security policies in our database. However, no method of
        electronic transmission or storage is 100% secure.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">8. Children&rsquo;s Privacy</h2>
      <p className="mb-4">
        The App is not directed at children under 13. We do not knowingly collect personal information from
        children under 13. If you believe a child has provided us with personal information, please contact
        us and we will delete it.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">9. Changes to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. We will notify you of any material changes by
        posting the updated policy in the App and updating the &ldquo;Last updated&rdquo; date above.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">10. Contact Us</h2>
      <p className="mb-4">
        If you have questions about this Privacy Policy or your data, contact us at:
      </p>
      <p className="mb-2"><strong>BCI Management Group, LLC</strong></p>
      <p className="mb-2">
        Email: <a href="mailto:support@bcimgt.com" className="text-blue-600 underline">support@bcimgt.com</a>
      </p>

      <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} BCI Management Group, LLC. All rights reserved.</p>
      </div>
    </div>
  )
}
