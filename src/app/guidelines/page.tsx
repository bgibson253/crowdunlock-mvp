import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "Unmaskr community guidelines: rules for participation.",
};

export default function GuidelinesPage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
        <h1>Community Guidelines</h1>
        <p className="text-muted-foreground">Last updated: March 29, 2026</p>

        <p>
          Unmaskr is a platform for crowdfunding truth and unlocking content that matters. These
          guidelines exist to keep the community productive, respectful, and safe.
        </p>

        <h2>🟢 What We Encourage</h2>
        <ul>
          <li><strong>Substantive discussion:</strong> back up claims with sources</li>
          <li><strong>Constructive disagreement:</strong> challenge ideas, not people</li>
          <li><strong>Original research and investigation:</strong> the core of what Unmaskr is about</li>
          <li><strong>Helping new members:</strong> everyone starts somewhere</li>
          <li><strong>Responsible disclosure:</strong> consider the impact of what you share</li>
        </ul>

        <h2>🔴 What&apos;s Not Allowed</h2>

        <h3>Harassment &amp; Abuse</h3>
        <p>
          No targeted abuse, threats, bullying, or doxxing. Disagreement is fine; personal attacks are not.
          This includes DMs. Abuse reported by recipients will be investigated.
        </p>

        <h3>Hate Speech</h3>
        <p>
          No slurs, dehumanization, or identity-based attacks. Content that promotes discrimination
          based on race, ethnicity, gender, sexual orientation, religion, or disability is not tolerated.
        </p>

        <h3>Spam &amp; Manipulation</h3>
        <p>
          No promotional spam, link farming, bot-driven posting, or coordinated inauthentic behavior.
          Sock puppet accounts used to manipulate discussions will be banned.
        </p>

        <h3>Misinformation</h3>
        <p>
          Presenting demonstrably false claims as established fact is not allowed. Speculation and
          opinion are fine, but be clear about what&apos;s verified and what&apos;s not.
        </p>

        <h3>NSFW Content</h3>
        <p>Sexually explicit or gratuitously violent content is not allowed.</p>

        <h3>Illegal Content</h3>
        <p>
          Content promoting illegal activity, containing malware, or infringing on intellectual
          property is prohibited.
        </p>

        <h3>Self-Harm</h3>
        <p>Content encouraging or glorifying self-harm or suicide is not allowed.</p>

        <h2>📜 Copyright &amp; DMCA</h2>
        <p>
          Unmaskr respects intellectual property rights. If you believe content on the platform
          infringes your copyright, you can file a{" "}
          <a href="/dmca" className="text-primary hover:underline">DMCA takedown notice</a>.
        </p>
        <ul>
          <li>We respond to valid DMCA notices promptly and will remove or disable access to infringing content</li>
          <li>Repeat infringers will have their accounts terminated</li>
          <li>Counter-notices are available if you believe your content was removed in error</li>
          <li>Fraudulent DMCA claims may result in legal liability and platform penalties</li>
        </ul>

        <h2>⚖️ How Moderation Works</h2>
        <ol>
          <li>
            <strong>AI review:</strong> Posts are reviewed by an AI moderation system that checks
            for guideline violations. Clear violations may be auto-hidden.
          </li>
          <li>
            <strong>Dispute:</strong> If your post is flagged or removed by AI, you can dispute the
            decision. Disputed posts are queued for re-review.
          </li>
          <li>
            <strong>Human review:</strong> Admins handle escalated disputes, reports from other
            users, and edge cases the AI isn&apos;t sure about.
          </li>
          <li>
            <strong>Transparency:</strong> You can see why your post was flagged. Moderation
            reasoning is always provided.
          </li>
        </ol>

        <h2>🏅 Trust Levels</h2>
        <p>
          Your trust level reflects your participation and community standing. Higher trust unlocks
          features like image uploads, video embeds, and more. Trust is earned through consistent,
          constructive participation.
        </p>

        <h2>📢 Reporting</h2>
        <p>
          If you see content that violates these guidelines, use the <strong>Report</strong> button
          on any post or reply. Reports are reviewed by admins.
        </p>

        <h2>🚨 Account Penalties</h2>
        <ul>
          <li><strong>Warning:</strong> First minor offense. Content removed, written warning issued.</li>
          <li><strong>Temporary mute:</strong> Repeated minor violations. Posting restricted for 24 to 72 hours.</li>
          <li><strong>Temporary suspension:</strong> Continued violations. Account access restricted for 7 to 30 days.</li>
          <li><strong>Trust level reduction:</strong> Violations may reduce your trust level and remove earned privileges.</li>
          <li><strong>Permanent ban:</strong> Severe violations (threats, doxxing, illegal content, CSAM). Immediate and permanent.</li>
        </ul>
        <p>
          All moderation actions can be appealed via{" "}
          <a href="/contact" className="text-primary hover:underline">our contact form</a>.
          Appeals are reviewed within 48 hours.
        </p>

        <h2>Questions?</h2>
        <p>
          If you&apos;re unsure whether something is allowed, ask in the{" "}
          <a href="/forum/s/general" className="text-primary hover:underline">
            General Discussion
          </a>{" "}
          section or <a href="/contact" className="text-primary hover:underline">contact us</a>.
        </p>
      </div>
    </div>
  );
}
