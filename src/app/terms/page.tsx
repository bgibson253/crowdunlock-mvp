import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Unmaskr terms of service — rules for using the platform.",
};

export default function TermsPage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: March 29, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Unmaskr (&quot;the platform&quot;), you agree to be bound by these Terms of
          Service. If you do not agree, do not use the platform.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 13 years old to use Unmaskr. By creating an account, you represent that
          you meet this requirement and that the information you provide is accurate.
        </p>

        <h2>3. Account Responsibilities</h2>
        <ul>
          <li>You are responsible for maintaining the security of your account credentials</li>
          <li>You are responsible for all activity under your account</li>
          <li>You must not share your account or use another person&apos;s account</li>
          <li>Notify us immediately if you suspect unauthorized access</li>
        </ul>

        <h2>4. Content Ownership &amp; License</h2>
        <p>
          You retain ownership of all content you create on Unmaskr. By posting content, you grant
          Unmaskr a non-exclusive, worldwide, royalty-free license to display, distribute, and store
          your content on the platform. This license ends when you delete the content.
        </p>

        <h2>5. Prohibited Content</h2>
        <p>You may not post content that:</p>
        <ul>
          <li>Is illegal, threatening, abusive, harassing, or defamatory</li>
          <li>Contains hate speech, slurs, or promotes discrimination</li>
          <li>Is spam, phishing, or commercially deceptive</li>
          <li>Contains malware or attempts to exploit the platform</li>
          <li>Infringes on intellectual property rights</li>
          <li>Contains sexually explicit material involving minors</li>
          <li>Promotes self-harm or violence</li>
          <li>Doxxes or exposes private information about others</li>
        </ul>

        <h2>6. AI Moderation</h2>
        <p>
          Content may be reviewed by automated systems to enforce community guidelines. Posts flagged
          or removed by AI moderation can be disputed by the author. Disputed content is queued for
          re-review. Final decisions on escalated disputes are made by human moderators.
        </p>

        <h2>7. Crowdfunding</h2>
        <ul>
          <li>Contributions fund the unlocking of specific content</li>
          <li>Once a funding goal is met, content is unlocked publicly for everyone</li>
          <li>Contributions are non-refundable once the funding goal is met; if the deadline passes without reaching the goal, all contributions are refunded</li>
          <li>Unmaskr may charge a platform fee on successfully funded content</li>
          <li>Unmaskr does not guarantee the accuracy or quality of unlocked content</li>
        </ul>

        <h2>8. Trust Levels</h2>
        <p>
          Users earn trust levels based on participation and community behavior. Higher trust levels
          unlock additional features (e.g., image uploads, video embeds). Trust levels may be adjusted
          automatically or manually by moderators.
        </p>

        <h2>9. Direct Messages</h2>
        <p>
          Direct messages are end-to-end encrypted. Unmaskr cannot read your encrypted messages.
          The same content policies apply to DMs — abuse reported by recipients will be investigated.
        </p>

        <h2>10. Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these terms, at our discretion and without
          prior notice for severe violations. You may delete your account at any time.
        </p>

        <h2>11. Disclaimers</h2>
        <ul>
          <li>The platform is provided &quot;as is&quot; without warranties of any kind</li>
          <li>We do not guarantee uptime, data preservation, or uninterrupted service</li>
          <li>We are not liable for user-generated content or crowdfunding outcomes</li>
        </ul>

        <h2>12. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Unmaskr&apos;s total liability for any claim arising
          from your use of the platform is limited to the amount you have paid to Unmaskr in the
          12 months preceding the claim, or $100, whichever is greater.
        </p>

        <h2>13. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use after changes constitutes
          acceptance. Material changes will be announced on the platform.
        </p>

        <h2>14. Contact</h2>
        <p>
          Questions? Contact us at{" "}
          <a href="mailto:legal@unmaskr.org" className="text-primary hover:underline">
            legal@unmaskr.org
          </a>{" "}
          or visit our <a href="/contact" className="text-primary hover:underline">contact page</a>.
        </p>
      </div>
    </div>
  );
}
