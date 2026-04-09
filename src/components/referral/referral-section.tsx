"use client";

import * as React from "react";
import { Copy, Check, Users, UserPlus, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ReferralStats = {
  total_referrals: number;
  converted: number;
  total_clicks: number;
};

export function ReferralSection({
  referralCode,
  stats,
  appUrl,
}: {
  referralCode: string;
  stats: ReferralStats;
  appUrl: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const inviteUrl = `${appUrl}/r/${referralCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Badge thresholds
  const badges = [];
  if (stats.converted >= 5) badges.push({ label: "Recruiter", count: 5 });
  if (stats.converted >= 25) badges.push({ label: "Ambassador", count: 25 });
  if (stats.converted >= 100) badges.push({ label: "Legend", count: 100 });

  return (
    <div className="space-y-6">
      {/* Invite link */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Your Invite Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Share your unique link. When someone signs up, you earn referral credit!
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteUrl}
              className="bg-muted/30 text-xs font-mono"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 min-w-[80px]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 text-center">
            <MousePointerClick className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold tabular-nums">{stats.total_clicks}</p>
            <p className="text-xs text-muted-foreground">Link clicks</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold tabular-nums">{stats.total_referrals}</p>
            <p className="text-xs text-muted-foreground">Invited</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 text-center">
            <UserPlus className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold tabular-nums">{stats.converted}</p>
            <p className="text-xs text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Referral Badges</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <Badge key={b.label} variant="secondary" className="bg-primary/10 text-primary">
                🏅 {b.label} ({b.count}+ referrals)
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next badge progress */}
      {stats.converted < 100 && (
        <div className="text-xs text-muted-foreground text-center">
          {stats.converted < 5
            ? `${5 - stats.converted} more referral${5 - stats.converted !== 1 ? "s" : ""} to earn the Recruiter badge 🏅`
            : stats.converted < 25
              ? `${25 - stats.converted} more to earn Ambassador badge 🏅`
              : `${100 - stats.converted} more to earn Legend badge 🏅`}
        </div>
      )}
    </div>
  );
}
