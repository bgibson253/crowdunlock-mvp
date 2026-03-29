export default function TermsPage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>
        <h2>Acceptance</h2>
        <p>By using Unmaskr, you agree to these terms.</p>
        <h2>Accounts</h2>
        <p>
          You must provide accurate information and keep your credentials secure.
          You are responsible for all activity under your account.
        </p>
        <h2>Content</h2>
        <p>
          You retain ownership of content you post. By posting, you grant Unmaskr a license to display
          and distribute it on the platform. Do not post illegal, harmful, or infringing content.
        </p>
        <h2>Crowdfunding</h2>
        <p>
          Contributions are non-refundable unless the content is not delivered. Unlocked content
          becomes available to all contributors once the funding goal is met.
        </p>
        <h2>Termination</h2>
        <p>We may suspend or terminate accounts that violate these terms.</p>
        <h2>Disclaimers</h2>
        <p>The service is provided "as is" without warranties of any kind.</p>
      </div>
    </div>
  );
}
