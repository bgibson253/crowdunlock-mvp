"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "unmaskr_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-xl rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Cookie className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium">We use cookies</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              We use essential cookies for authentication and preferences. No
              third-party tracking.{" "}
              <a
                href="/privacy"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={decline}
            className="text-xs text-muted-foreground"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={accept}
            className="bg-primary hover:bg-primary/90 text-xs shadow-lg shadow-primary/20"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
