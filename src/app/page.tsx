import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Users,
  TrendingUp,
  Brain,
  Lock,
  Eye,
  ArrowRight,
  Sparkles,
  MessageSquare,
  DollarSign,
  FileSearch,
  Zap,
  CheckCircle2,
  Clock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Unmaskr: Crowdfunded Content, AI-Verified",
  description:
    "The crowdfunding platform where communities fund the stories, data, and content that matter. AI-powered moderation keeps it fair. End-to-end encryption keeps it private.",
  openGraph: {
    title: "Unmaskr: Crowdfunded Content, AI-Verified",
    description:
      "Communities fund the content that matters. AI moderation. E2E encrypted DMs. Transparent trust levels.",
    type: "website",
    siteName: "Unmaskr",
  },
};

/* ── Stats fetched at render time (ISR 5 min) ── */
export const revalidate = 300;

async function getStats() {
  try {
    const supabase = await supabaseServer();

    const [uploads, users, threads] = await Promise.all([
      supabase.from("uploads").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("forum_threads").select("id", { count: "exact", head: true }),
    ]);

    return {
      uploads: uploads.count ?? 0,
      users: users.count ?? 0,
      threads: threads.count ?? 0,
    };
  } catch {
    return { uploads: 0, users: 0, threads: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      {/* ═══════════════════════════════════════════
          BACKGROUND EFFECTS
          ═══════════════════════════════════════════ */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />
        {/* Large radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[1000px] h-[800px] bg-primary/6 rounded-full blur-[120px]" />
        {/* Secondary glow */}
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-chart-4/5 rounded-full blur-[100px]" />
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-primary/4 rounded-full blur-[100px]" />
      </div>

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-6xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            AI-Powered Transparency Platform
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          The Truth Has a Cost.{" "}
          <span className="gradient-text">Let&rsquo;s Crowdfund It.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-muted-foreground leading-relaxed sm:text-xl">
          Unmaskr is where communities pool funds to unlock the stories, data, documents, and videos
          they want to see. Creators set a goal, the crowd funds it, and AI keeps the platform fair.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {user ? (
            <>
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 text-base px-8"
              >
                <Link href="/browse">
                  Browse Uploads
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border/50 backdrop-blur-sm text-base px-8"
              >
                <Link href="/upload">Upload Content</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 text-base px-8"
              >
                <Link href="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border/50 backdrop-blur-sm text-base px-8"
              >
                <Link href="/forum">Explore the Forum</Link>
              </Button>
            </>
          )}
        </div>

        {/* Social proof stats */}
        {(stats.users > 0 || stats.uploads > 0) && (
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {[
              { value: stats.users, label: "Community Members", icon: Users },
              { value: stats.uploads, label: "Uploads Listed", icon: FileSearch },
              { value: stats.threads, label: "Forum Discussions", icon: MessageSquare },
            ]
              .filter((s) => s.value > 0)
              .map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <stat.icon className="h-5 w-5 text-primary/60" />
                    <span className="text-3xl font-bold tabular-nums">{stat.value.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">{stat.label}</span>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How <span className="gradient-text">Unmaskr</span> Works
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            From upload to unlock in four steps. Everyone contributes, everyone benefits.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "01",
              icon: FileSearch,
              title: "Upload or Request",
              desc: "Someone uploads a document, story, or dataset (or the community requests one). Set a funding goal and deadline.",
              color: "text-blue-400",
            },
            {
              step: "02",
              icon: DollarSign,
              title: "Crowdfund It",
              desc: "Contributors pool money toward the unlock goal. If the deadline passes unfunded, everyone gets refunded.",
              color: "text-emerald-400",
            },
            {
              step: "03",
              icon: Brain,
              title: "AI Verifies",
              desc: "Our AI moderation system reviews content for quality, flags issues, and builds trust scores. Fully transparent.",
              color: "text-purple-400",
            },
            {
              step: "04",
              icon: Eye,
              title: "Content Unlocked",
              desc: "Once fully funded, the content unlocks instantly and goes public for everyone. The community decides what gets made.",
              color: "text-amber-400",
            },
          ].map((item) => (
            <Card
              key={item.step}
              className="card-hover border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative group"
            >
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-6 pb-5 px-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono text-primary/40 font-bold">{item.step}</span>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 border border-border/30 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          AI SECTION — THE DIFFERENTIATOR
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left: Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 text-xs font-medium text-purple-400 mb-6">
              <Brain className="h-3 w-3" />
              Powered by AI
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              AI That Works <span className="text-purple-400">for</span> the Community,{" "}
              <span className="text-purple-400">Not Against It</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Most platforms use AI to suppress. Unmaskr uses it to protect. Our AI moderation system
              is transparent, auditable, and disputable. It's designed to keep the forum clean without
              censoring truth.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                {
                  title: "Transparent Moderation",
                  desc: "Every AI decision is logged with reasoning and confidence scores. Nothing happens in the dark.",
                  icon: Eye,
                },
                {
                  title: "Dispute Any Decision",
                  desc: "Disagree with AI? Hit dispute and a human reviews it. The community always has the final say.",
                  icon: Shield,
                },
                {
                  title: "AI-Generated Teasers",
                  desc: "Locked content gets an AI-written teaser so you know what you're funding before you contribute.",
                  icon: Sparkles,
                },
                {
                  title: "Trust Levels",
                  desc: "AI + community behavior builds your trust score. Higher trust unlocks more features: image uploads, video embeds, and advanced formatting.",
                  icon: TrendingUp,
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Visual card */}
          <div className="relative">
            <Card className="border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/60 to-purple-500/0" />
              <CardContent className="p-6 space-y-4">
                {/* Simulated moderation feed */}
                <div className="text-xs font-mono text-purple-400/60 uppercase tracking-wider mb-2">
                  Live Moderation Feed
                </div>

                {[
                  {
                    action: "approved",
                    content: "Thread: \"City council financial records 2024–2025\"",
                    confidence: "98%",
                    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  },
                  {
                    action: "flagged",
                    content: "Reply: Contains unverified claims about...",
                    confidence: "72%",
                    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                  },
                  {
                    action: "approved",
                    content: "Upload: Leaked internal memo (verified format)",
                    confidence: "95%",
                    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  },
                  {
                    action: "rejected",
                    content: "Thread: Spam / commercial solicitation",
                    confidence: "99%",
                    color: "text-red-400 bg-red-500/10 border-red-500/20",
                  },
                  {
                    action: "disputed",
                    content: "Reply: Author contested AI decision → human review",
                    confidence: "—",
                    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${item.color}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider w-16 shrink-0">
                      {item.action}
                    </span>
                    <span className="text-xs text-muted-foreground flex-1 line-clamp-1">
                      {item.content}
                    </span>
                    <span className="text-[10px] font-mono shrink-0">{item.confidence}</span>
                  </div>
                ))}

                <div className="pt-2 text-center">
                  <span className="text-[10px] text-muted-foreground/50">
                    All decisions are logged, auditable, and disputable
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Decorative dots */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border border-primary/10 rounded-2xl rotate-12 hidden lg:block" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-purple-500/10 rounded-xl -rotate-6 hidden lg:block" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES GRID
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Creators, Researchers, and Curious People
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Every feature exists to make crowdfunded content safer, faster, and fairer.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Lock,
              title: "E2E Encrypted DMs",
              desc: "Creators and users communicate privately with ECDH + AES-256-GCM encryption. Even we can't read your messages.",
              gradient: "from-cyan-500/10 to-blue-500/10",
              iconColor: "text-cyan-400",
            },
            {
              icon: Clock,
              title: "Funding Deadlines",
              desc: "Set a 30-day to 1-year deadline. If the goal isn't met, every contributor gets a full refund. Zero risk.",
              gradient: "from-amber-500/10 to-orange-500/10",
              iconColor: "text-amber-400",
            },
            {
              icon: MessageSquare,
              title: "Threaded Forum",
              desc: "Request content, discuss uploads, react with emoji, mark solutions. Full-text search, @mentions, and nested replies.",
              gradient: "from-emerald-500/10 to-green-500/10",
              iconColor: "text-emerald-400",
            },
            {
              icon: Shield,
              title: "Trust Levels",
              desc: "Earn trust through participation, from Newbie to Leader. Higher levels unlock images, video embeds, and moderation privileges.",
              gradient: "from-purple-500/10 to-violet-500/10",
              iconColor: "text-purple-400",
            },
            {
              icon: Zap,
              title: "Instant Unlock",
              desc: "The moment funding hits 100%, content goes public for everyone, not just contributors. No delays, no gatekeepers.",
              gradient: "from-yellow-500/10 to-amber-500/10",
              iconColor: "text-yellow-400",
            },
            {
              icon: Globe,
              title: "Fully Open Forum",
              desc: "Anyone can read forum discussions. Sign up to post, react, and contribute to funding campaigns.",
              gradient: "from-blue-500/10 to-indigo-500/10",
              iconColor: "text-blue-400",
            },
          ].map((feature) => (
            <Card
              key={feature.title}
              className="card-hover border-border/50 bg-card/50 backdrop-blur-sm group overflow-hidden"
            >
              <CardContent className="pt-6 pb-5 px-5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} border border-border/30 mb-4 ${feature.iconColor}`}
                >
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TRUST / SECURITY SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-4xl px-4 py-20">
        <Card className="border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
          <CardContent className="p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Our Commitments</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "We never sell your data. Period.",
                "AI decisions are always auditable and disputable.",
                "End-to-end encryption on all private messages.",
                "Full refunds if funding deadlines aren't met.",
                "No third-party tracking pixels or ad networks.",
                "Open trust system. Your level is earned, never bought.",
                "DMCA process for legitimate takedowns.",
                "You can delete your account and data anytime.",
              ].map((commitment) => (
                <div key={commitment} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{commitment}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ═══════════════════════════════════════════
          WHO IS THIS FOR?
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Who Uses Unmaskr?</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              emoji: "🎬",
              title: "Creators & Uploaders",
              desc: "Upload your work, set a funding goal, and let the community back what they want to see. Documentaries, datasets, investigative pieces, tutorials, and more.",
            },
            {
              emoji: "📰",
              title: "Journalists & Researchers",
              desc: "Request specific data, documents, or expert analysis. The forum lets you coordinate with the community and find collaborators before committing resources.",
            },
            {
              emoji: "💰",
              title: "Supporters & Contributors",
              desc: "Fund the content you care about. Read AI-generated teasers to decide what's worth backing. Once funded, the content goes public for everyone.",
            },
          ].map((persona) => (
            <Card
              key={persona.title}
              className="card-hover border-border/50 bg-card/50 backdrop-blur-sm text-center"
            >
              <CardContent className="pt-8 pb-6 px-6">
                <div className="text-4xl mb-4">{persona.emoji}</div>
                <h3 className="text-lg font-semibold mb-3">{persona.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{persona.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-4xl px-4 pt-20 pb-32">
        <div className="relative rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
          {/* Gradient border top */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0" />
          {/* Subtle background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[60px]" />
          </div>

          <div className="px-8 py-14 sm:px-12 sm:py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The Truth Won&rsquo;t Fund Itself
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Join a community that puts its money where its curiosity is. Whether you&rsquo;re
              a creator sharing your work, a researcher seeking data, or someone who wants to
              fund great content, this is where it starts.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 text-base px-8"
                  >
                    <Link href="/browse">
                      Start Browsing
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-border/50 text-base px-8"
                  >
                    <Link href="/upload">Upload Content</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 text-base px-8"
                  >
                    <Link href="/auth">
                      Create Free Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-border/50 text-base px-8"
                  >
                    <Link href="/forum">Read the Forum</Link>
                  </Button>
                </>
              )}
            </div>

            <p className="mt-6 text-xs text-muted-foreground/50">
              Free to join · No credit card required · Your data is yours
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
