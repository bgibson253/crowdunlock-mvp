"use client";

import { MessageSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileChatDrawer(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("lg:hidden", props.className)}>
      <Sheet open={props.open} onOpenChange={props.onOpenChange}>
        <SheetTrigger>
          <Button
            variant="secondary"
            className="bg-black/55 text-white border border-white/10 hover:bg-black/40"
            aria-label="Open chat"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70dvh] p-0">
          <SheetHeader className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base">Chat</SheetTitle>
              <Button variant="ghost" onClick={() => props.onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="h-[calc(70dvh-52px)]">{props.children}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
