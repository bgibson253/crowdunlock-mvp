export default function PrivacyPage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>
        <p>
          Unmaskr collects only the information necessary to provide the service: your email address for authentication,
          profile information you choose to share, and content you upload or post. We do not sell your personal data.
        </p>
        <h2>Data We Collect</h2>
        <ul>
          <li>Account info (email, username, profile details)</li>
          <li>Content you create (threads, replies, uploads)</li>
          <li>Usage data (page views, interactions) for analytics</li>
        </ul>
        <h2>How We Use It</h2>
        <p>To operate the platform, send notifications, and improve the experience.</p>
        <h2>Your Rights</h2>
        <p>You can delete your account and data at any time by contacting us.</p>
        <h2>Contact</h2>
        <p>Questions? Reach out at <a href="/contact">our contact page</a>.</p>
      </div>
    </div>
  );
}
