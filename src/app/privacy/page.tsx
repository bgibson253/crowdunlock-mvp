import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Unmaskr privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: March 29, 2026</p>

        <h2>1. Information We Collect</h2>
        <h3>Account Information</h3>
        <p>
          When you create an account, we collect your email address, username, and any profile details
          you choose to provide (display name, avatar, bio, location, social links).
        </p>
        <h3>Content You Create</h3>
        <p>
          Forum threads, replies, direct messages, uploads, comments, and reactions you post on the platform.
          Direct messages are end-to-end encrypted — we cannot read their contents.
        </p>
        <h3>Usage Data</h3>
        <p>
          We collect anonymized analytics including page views, feature interactions, and device/browser
          information to improve the platform. We do not use third-party tracking pixels or sell data to advertisers.
        </p>
        <h3>Cookies</h3>
        <p>
          We use essential cookies for authentication and session management. No advertising or cross-site tracking cookies are used.
        </p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>Operate and maintain the platform</li>
          <li>Authenticate your identity and secure your account</li>
          <li>Send notifications you&apos;ve opted into (replies, mentions, subscriptions)</li>
          <li>Moderate content to maintain community standards (including AI-assisted moderation)</li>
          <li>Process crowdfunding contributions and refunds</li>
          <li>Improve features and fix bugs based on aggregated usage patterns</li>
        </ul>

        <h2>3. AI Moderation</h2>
        <p>
          Forum posts may be reviewed by an AI moderation system to detect spam, harassment, and other
          violations. AI decisions can be disputed by the post author for human review. AI moderation
          reasoning is logged for transparency and audit purposes.
        </p>

        <h2>4. Information Sharing</h2>
        <p>We do not sell, rent, or trade your personal information. We may share data only:</p>
        <ul>
          <li>With service providers who help operate the platform (hosting, payment processing, email delivery)</li>
          <li>When required by law or to protect the safety of our users</li>
          <li>In aggregated, anonymized form for analytics</li>
        </ul>

        <h2>5. Data Security</h2>
        <p>
          We use industry-standard security measures including HTTPS encryption, row-level security on our
          database, and end-to-end encryption for direct messages. However, no system is 100% secure.
        </p>

        <h2>6. Your Rights</h2>
        <ul>
          <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
          <li><strong>Correction:</strong> Update your profile information at any time</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
          <li><strong>Portability:</strong> Request your data in a standard format</li>
        </ul>

        <h2>7. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. After account deletion, we remove
          personal data within 30 days, though some content may remain in anonymized form.
        </p>

        <h2>8. Children</h2>
        <p>Unmaskr is not intended for users under 13. We do not knowingly collect data from children.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this policy from time to time. Material changes will be announced on the platform.</p>

        <h2>10. Contact</h2>
        <p>
          Questions about this policy? Contact us at{" "}
          <a href="mailto:privacy@unmaskr.org" className="text-indigo-600 hover:underline">
            privacy@unmaskr.org
          </a>{" "}
          or visit our <a href="/contact" className="text-indigo-600 hover:underline">contact page</a>.
        </p>
      </div>
    </div>
  );
}
