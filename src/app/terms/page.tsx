export const metadata = {
  title: 'Terms of Service - Converge Connect',
}

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 20, 2026</p>

      <p className="mb-6">
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Converge Connect mobile application
        (the &ldquo;App&rdquo;) operated by BCI Management Group, LLC (&ldquo;BCI,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
        or &ldquo;our&rdquo;). By using the App, you agree to these Terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1. Eligibility</h2>
      <p className="mb-4">
        You must be at least 18 years old to use the App. By creating an account, you represent that you are at
        least 18 years of age and have the legal capacity to enter into these Terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. Account Responsibilities</h2>
      <p className="mb-4">
        You are responsible for maintaining the confidentiality of your login credentials and for all activity
        under your account. You agree to provide accurate and complete information when creating your account
        and to update it as needed. You must notify us immediately of any unauthorized access to your account.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">3. Acceptable Use</h2>
      <p className="mb-4">You agree not to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Post content that is offensive, harassing, discriminatory, or otherwise objectionable</li>
        <li>Impersonate any person or entity</li>
        <li>Use the App to send spam, unsolicited messages, or commercial solicitations</li>
        <li>Attempt to gain unauthorized access to other users&rsquo; accounts or data</li>
        <li>Use lead retrieval data for purposes other than legitimate business follow-up from the event</li>
        <li>Scrape, harvest, or collect data from the App by automated means</li>
        <li>Interfere with or disrupt the App&rsquo;s operation</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. User Content</h2>
      <p className="mb-4">
        You retain ownership of content you post in the App (posts, comments, messages, photos). By posting
        content, you grant BCI a non-exclusive, worldwide license to display and distribute your content within
        the App for the purpose of providing the service. We may remove content that violates these Terms or
        applicable law.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">5. Lead Retrieval</h2>
      <p className="mb-4">
        Lead retrieval data is provided for legitimate business follow-up related to the event where the lead
        was captured. You agree not to use lead data for unrelated marketing, sell lead data to third parties,
        or retain lead data beyond the access window set by the event organizer. Lead access expires automatically
        after the period configured by the event organizer.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. Privacy</h2>
      <p className="mb-4">
        Your use of the App is also governed by our{' '}
        <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>, which describes how we collect,
        use, and protect your information.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">7. Intellectual Property</h2>
      <p className="mb-4">
        The App, its design, features, and content (excluding user-generated content) are owned by BCI Management
        Group, LLC. You may not copy, modify, distribute, or create derivative works based on the App without
        our written permission.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">8. Termination</h2>
      <p className="mb-4">
        We may suspend or terminate your account if you violate these Terms, engage in abusive behavior, or
        for any other reason at our discretion. You may delete your account at any time through the App&rsquo;s
        Settings. Upon termination, your right to use the App ceases immediately.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">9. Disclaimers</h2>
      <p className="mb-4">
        The App is provided &ldquo;as is&rdquo; without warranties of any kind, either express or implied. We do not
        guarantee the accuracy of information provided by event organizers, speakers, or other users. We are
        not responsible for the actions or content of third parties using the App.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">10. Limitation of Liability</h2>
      <p className="mb-4">
        To the maximum extent permitted by law, BCI shall not be liable for any indirect, incidental, special,
        consequential, or punitive damages arising from your use of the App, including but not limited to loss
        of data, business opportunities, or profits.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">11. Changes to Terms</h2>
      <p className="mb-4">
        We may update these Terms from time to time. Continued use of the App after changes are posted
        constitutes acceptance of the updated Terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">12. Contact Us</h2>
      <p className="mb-4">
        If you have questions about these Terms, contact us at:
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
