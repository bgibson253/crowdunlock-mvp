"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UsernameField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [saving, setSaving] = React.useState(false);

  async function save(username: string) {
    setSaving(true);
    try {
      await fetch("/api/profile/set-username", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Username"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="nickname"
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!value.trim() || saving}
        onClick={() => save(value.trim())}
      >
        {saving ? "Saving…" : "Save username"}
      </Button>
    </div>
  );
}
