"use client";

import { Check, Gauge } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import type { HlsVariant } from "@/components/live/overlay/hls-player";

export function QualityMenu(props: {
  value: "auto" | number;
  variants: HlsVariant[];
  disabled?: boolean;
  onChange: (v: "auto" | number) => void;
}) {
  const items = props.variants
    .slice()
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0) || (b.bitrate ?? 0) - (a.bitrate ?? 0));

  const label =
    props.value === "auto"
      ? "Auto"
      : items.find((x) => x.index === props.value)?.label ?? `Level ${props.value}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="secondary"
          className="bg-black/55 text-white border border-white/10 hover:bg-black/40"
          disabled={props.disabled}
          aria-label="Video quality"
        >
          <Gauge className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Quality</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => props.onChange("auto")}>
          {props.value === "auto" ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-6" />}
          Auto
        </DropdownMenuItem>
        {items.map((v) => (
          <DropdownMenuItem key={v.index} onClick={() => props.onChange(v.index)}>
            {props.value === v.index ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-6" />}
            {v.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-[11px] text-muted-foreground">
          Manual quality uses hls.js levels. Native HLS may ignore this.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
