import type { Metadata } from "next";
import { Shield, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Unmaskr privacy policy — how we collect, use, store, and protect your personal data.",
};

/* ────────────────────────────────────────────────
   Section wrapper — keeps visual rhythm consistent
   ──────────────────────────────────────────────── */
function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight mt-10 mb-3">
        <span className="text-primary/60 font-mono text-sm">{String(number).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />

      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-1">
          <strong>Effective date:</strong> March 29, 2026 &nbsp;·&nbsp; <strong>Last revised:</strong> April 9, 2026
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Unmaskr (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;the Platform&rdquo;) is committed to protecting your
          privacy. This Privacy Policy explains what information we collect, why we collect it, how we
          use and share it, and the choices you have.
        </p>

        {/* ── Table of Contents ── */}
        <Card className="mb-10 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-4 px-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contents</p>
            <ol className="columns-2 gap-x-6 text-sm space-y-1 list-decimal list-inside marker:text-primary/50">
              <li><a href="#info-collected" className="hover:text-primary transition-colors">Information We Collect</a></li>
              <li><a href="#cookies" className="hover:text-primary transition-colors">Cookies &amp; Similar Technologies</a></li>
              <li><a href="#how-we-use" className="hover:text-primary transition-colors">How We Use Your Information</a></li>
              <li><a href="#legal-bases" className="hover:text-primary transition-colors">Legal Bases for Processing</a></li>
              <li><a href="#ai-moderation" className="hover:text-primary transition-colors">AI-Assisted Moderation</a></li>
              <li><a href="#sharing" className="hover:text-primary transition-colors">Information Sharing &amp; Disclosure</a></li>
              <li><a href="#service-providers" className="hover:text-primary transition-colors">Service Providers</a></li>
              <li><a href="#data-security" className="hover:text-primary transition-colors">Data Security</a></li>
              <li><a href="#retention" className="hover:text-primary transition-colors">Data Retention</a></li>
              <li><a href="#your-rights" className="hover:text-primary transition-colors">Your Rights &amp; Choices</a></li>
              <li><a href="#ccpa" className="hover:text-primary transition-colors">California Privacy Rights (CCPA)</a></li>
              <li><a href="#international" className="hover:text-primary transition-colors">International Transfers</a></li>
              <li><a href="#children" className="hover:text-primary transition-colors">Children&rsquo;s Privacy</a></li>
              <li><a href="#changes" className="hover:text-primary transition-colors">Changes to This Policy</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ol>
          </CardContent>
        </Card>

        {/* ── Sections ── */}

        <Section id="info-collected" number={1} title="Information We Collect">
          <h3 className="text-foreground font-medium text-sm mt-2">1.1 &nbsp;Information You Provide</h3>
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li><strong>Account registration:</strong> Email address, username, and password (hashed; we never store plaintext passwords).</li>
            <li><strong>Profile details:</strong> Display name, avatar image, bio, location, and social-media links you choose to add.</li>
            <li><strong>User-generated content:</strong> Forum threads, replies, reactions, blog posts, uploads, and related metadata.</li>
            <li><strong>Direct messages:</strong> Messages sent via our DM feature are <strong>end-to-end encrypted</strong> (ECDH P-256&nbsp;+&nbsp;AES-256-GCM). We store only the ciphertext; we cannot read your messages.</li>
            <li><strong>Financial information:</strong> When you make a contribution, payment details are collected and processed directly by our payment processor (Stripe). We receive only a transaction identifier, the amount, and confirmation of success — <em>never</em> your full card number.</li>
            <li><strong>Communications with us:</strong> Content of emails, DMCA notices, or contact-form submissions you send to our team.</li>
          </ul>

          <h3 className="text-foreground font-medium text-sm mt-4">1.2 &nbsp;Information Collected Automatically</h3>
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li><strong>Log &amp; device data:</strong> IP address, browser type and version, operating system, referring URL, pages visited, and timestamps.</li>
            <li><strong>Usage analytics:</strong> Aggregated, anonymized interaction data (page views, feature usage) used solely to improve the Platform. We do <em>not</em> use third-party tracking pixels, advertising SDKs, or cross-site trackers.</li>
          </ul>
        </Section>

        <Section id="cookies" number={2} title="Cookies & Similar Technologies">
          <p>We categorize cookies as follows:</p>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-left text-foreground">
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">Purpose</th>
                  <th className="py-2 font-medium">Can You Decline?</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/30">
                  <td className="py-2 pr-4 font-medium text-foreground">Essential</td>
                  <td className="py-2 pr-4">Authentication, session management, CSRF protection, cookie-consent preference</td>
                  <td className="py-2">No — required for core functionality</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-2 pr-4 font-medium text-foreground">Functional</td>
                  <td className="py-2 pr-4">Remembering your preferences (e.g., theme, sort order)</td>
                  <td className="py-2">Yes</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Analytics</td>
                  <td className="py-2 pr-4">Anonymized usage statistics (no cross-site tracking)</td>
                  <td className="py-2">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3">
            We do <strong>not</strong> use advertising cookies, social-media tracking pixels, or any
            technology that profiles you across other websites. When you click &ldquo;Decline
            non-essential,&rdquo; we disable all non-essential cookies immediately.
          </p>
        </Section>

        <Section id="how-we-use" number={3} title="How We Use Your Information">
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li>Operate, maintain, and improve the Platform</li>
            <li>Authenticate your identity and secure your account</li>
            <li>Process crowdfunding contributions and issue refunds</li>
            <li>Send transactional notifications you have opted into (replies, mentions, subscriptions, digest emails)</li>
            <li>Enforce our <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/guidelines" className="text-primary hover:underline">Community Guidelines</a></li>
            <li>Moderate content to maintain community standards, including through AI-assisted review (see Section 5)</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Generate aggregated, de-identified analytics to guide product development</li>
          </ul>
          <p>We will <strong>never</strong> use your data to build advertising profiles or sell it to data brokers.</p>
        </Section>

        <Section id="legal-bases" number={4} title="Legal Bases for Processing">
          <p>Where applicable (e.g., under the GDPR), we rely on the following legal bases:</p>
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li><strong>Contract performance:</strong> Processing necessary to provide you the services you signed up for (account management, content hosting, payments).</li>
            <li><strong>Legitimate interests:</strong> Security, fraud prevention, product improvement, and enforcing our terms — balanced against your privacy rights.</li>
            <li><strong>Consent:</strong> Optional analytics cookies and marketing emails, which you can withdraw at any time.</li>
            <li><strong>Legal obligation:</strong> Compliance with applicable laws, regulations, or valid legal processes.</li>
          </ul>
        </Section>

        <Section id="ai-moderation" number={5} title="AI-Assisted Moderation">
          <p>
            Forum posts and replies may be evaluated by an automated moderation system to detect spam,
            harassment, and other violations of our Community Guidelines. We want you to understand how
            this works:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li>AI decisions are logged in an auditable moderation log, including the confidence score and reasoning.</li>
            <li>Posts rejected with high confidence may be hidden automatically. Posts flagged with lower confidence are queued for human review.</li>
            <li>You can <strong>dispute</strong> any AI decision from the post itself. Disputed content is escalated to a human moderator.</li>
            <li>No AI-generated profile or behavioral score is shared with third parties or used for any purpose outside of content moderation.</li>
          </ul>
        </Section>

        <Section id="sharing" number={6} title="Information Sharing & Disclosure">
          <p>
            We do <strong>not</strong> sell, rent, or trade your personal information. We may disclose
            data only in the following limited circumstances:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li><strong>Service providers:</strong> Trusted vendors who process data on our behalf under strict contractual obligations (see Section 7).</li>
            <li><strong>Legal requirements:</strong> When required by law, regulation, subpoena, or court order, or to protect the rights, safety, or property of Unmaskr and its users.</li>
            <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets — your data would remain subject to the protections in this policy.</li>
            <li><strong>Aggregated data:</strong> We may share anonymized, aggregated statistics that cannot reasonably be used to identify you.</li>
          </ul>
        </Section>

        <Section id="service-providers" number={7} title="Service Providers">
          <p>We currently use the following third-party service providers:</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-left text-foreground">
                  <th className="py-2 pr-4 font-medium">Provider</th>
                  <th className="py-2 pr-4 font-medium">Purpose</th>
                  <th className="py-2 font-medium">Data Processed</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/30">
                  <td className="py-2 pr-4 font-medium text-foreground">Supabase</td>
                  <td className="py-2 pr-4">Database hosting, authentication, file storage</td>
                  <td className="py-2">Account data, content, uploaded files</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-2 pr-4 font-medium text-foreground">Vercel</td>
                  <td className="py-2 pr-4">Application hosting &amp; CDN</td>
                  <td className="py-2">Log data (IP, user-agent)</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-2 pr-4 font-medium text-foreground">Stripe</td>
                  <td className="py-2 pr-4">Payment processing</td>
                  <td className="py-2">Payment method details, transaction records</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Resend</td>
                  <td className="py-2 pr-4">Transactional email delivery</td>
                  <td className="py-2">Email address, message content</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2">
            Each provider is contractually bound to process your data only as instructed by us and to
            maintain appropriate security measures. We regularly review our vendor relationships.
          </p>
        </Section>

        <Section id="data-security" number={8} title="Data Security">
          <p>We employ multiple layers of protection:</p>
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li><strong>Encryption in transit:</strong> All connections use TLS/HTTPS. HSTS is enforced.</li>
            <li><strong>Encryption at rest:</strong> Direct messages use end-to-end encryption (ECDH P-256&nbsp;+&nbsp;AES-256-GCM). Database storage is encrypted at the infrastructure level.</li>
            <li><strong>Access control:</strong> Row-level security (RLS) policies ensure users can only access data they are authorized to see.</li>
            <li><strong>Authentication hardening:</strong> Passwords are hashed with bcrypt. Auth cookies are <code>httpOnly</code>, <code>Secure</code>, and <code>SameSite=Lax</code>.</li>
            <li><strong>Rate limiting:</strong> All API endpoints are rate-limited to mitigate brute-force and abuse attempts.</li>
          </ul>
          <p>
            No system is 100% secure. If you become aware of a security vulnerability, please report
            it to <a href="mailto:security@unmaskr.org" className="text-primary hover:underline">security@unmaskr.org</a>.
          </p>
        </Section>

        <Section id="retention" number={9} title="Data Retention">
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li><strong>Active accounts:</strong> We retain your data for as long as your account is active and as needed to provide the services.</li>
            <li><strong>Account deletion:</strong> When you delete your account, we remove personal identifiers within <strong>30 days</strong>. Some content (e.g., forum posts) may remain in anonymized form to preserve community discussion threads.</li>
            <li><strong>Legal holds:</strong> We may retain data longer if required by law or to resolve disputes.</li>
            <li><strong>Backups:</strong> Encrypted backups may contain deleted data for up to 90 days before being purged.</li>
          </ul>
        </Section>

        <Section id="your-rights" number={10} title="Your Rights & Choices">
          <p>Depending on your jurisdiction, you may have some or all of the following rights:</p>
          <div className="grid gap-2 sm:grid-cols-2 mt-2">
            {[
              { right: "Access", desc: "Request a copy of the personal data we hold about you." },
              { right: "Rectification", desc: "Correct inaccurate or incomplete data via your profile settings." },
              { right: "Erasure", desc: "Request deletion of your account and associated personal data." },
              { right: "Portability", desc: "Receive your data in a structured, machine-readable format." },
              { right: "Restrict processing", desc: "Ask us to limit how we process your data in certain circumstances." },
              { right: "Object", desc: "Object to processing based on our legitimate interests." },
              { right: "Withdraw consent", desc: "Withdraw consent for optional processing (e.g., analytics cookies) at any time." },
              { right: "Lodge a complaint", desc: "File a complaint with your local data-protection authority." },
            ].map((r) => (
              <div key={r.right} className="rounded-lg border border-border/40 bg-card/30 px-3 py-2">
                <p className="text-foreground font-medium text-sm">{r.right}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3">
            To exercise any of these rights, email{" "}
            <a href="mailto:privacy@unmaskr.org" className="text-primary hover:underline">privacy@unmaskr.org</a>.
            We will respond within 30 days (or sooner where required by law).
          </p>
        </Section>

        <Section id="ccpa" number={11} title="California Privacy Rights (CCPA)">
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act:</p>
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li><strong>Right to Know:</strong> You may request the categories and specific pieces of personal information we have collected about you in the past 12 months.</li>
            <li><strong>Right to Delete:</strong> You may request deletion of your personal information, subject to certain legal exceptions.</li>
            <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
            <li><strong>No Sale of Personal Information:</strong> We do <em>not</em> sell your personal information as defined by the CCPA, and we have not done so in the preceding 12 months.</li>
          </ul>
          <p>
            To submit a CCPA request, email{" "}
            <a href="mailto:privacy@unmaskr.org" className="text-primary hover:underline">privacy@unmaskr.org</a>{" "}
            with the subject line &ldquo;CCPA Request.&rdquo;
          </p>
        </Section>

        <Section id="international" number={12} title="International Transfers">
          <p>
            Unmaskr is operated from the United States. If you access the Platform from outside the
            U.S., your information may be transferred to, stored in, and processed in the United States
            or other jurisdictions where our service providers operate. By using the Platform, you
            consent to such transfers. Where required (e.g., EU/UK data), we rely on Standard
            Contractual Clauses or equivalent safeguards.
          </p>
        </Section>

        <Section id="children" number={13} title="Children's Privacy">
          <p>
            Unmaskr is not intended for users under the age of 13 (or 16 in jurisdictions where a
            higher minimum age applies). We do not knowingly collect personal information from children.
            If we learn that we have collected data from a child below the applicable age, we will
            delete that information promptly. If you believe a child has provided us with personal
            information, please contact us at{" "}
            <a href="mailto:privacy@unmaskr.org" className="text-primary hover:underline">privacy@unmaskr.org</a>.
          </p>
        </Section>

        <Section id="changes" number={14} title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or
            applicable law. When we make material changes, we will:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-1">
            <li>Update the &ldquo;Last revised&rdquo; date at the top of this page</li>
            <li>Post a notice on the Platform (e.g., a banner or notification)</li>
            <li>Where required by law, obtain your renewed consent</li>
          </ul>
          <p>
            Your continued use of the Platform after a revision becomes effective constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <Section id="contact" number={15} title="Contact Us">
          <p>If you have questions, concerns, or requests regarding this Privacy Policy, contact us:</p>
          <Card className="mt-3 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-4 px-5 flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@unmaskr.org" className="text-primary hover:underline">privacy@unmaskr.org</a>
                </p>
                <p>
                  <strong>Security issues:</strong>{" "}
                  <a href="mailto:security@unmaskr.org" className="text-primary hover:underline">security@unmaskr.org</a>
                </p>
                <p>
                  <strong>Web:</strong>{" "}
                  <a href="/contact" className="text-primary hover:underline">unmaskr.org/contact</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ── Footer note ── */}
        <div className="mt-12 pt-6 border-t border-border/30 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Unmaskr. All rights reserved.
        </div>
      </div>
    </div>
  );
}
