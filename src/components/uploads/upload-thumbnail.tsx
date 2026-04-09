"use client";

import Image from "next/image";
import { useState } from "react";
import { getFileTypeIcon } from "@/lib/file-type-icons";

export function UploadThumbnail({
  thumbnailUrl,
  filePath,
  title,
  className = "",
}: {
  thumbnailUrl?: string | null;
  filePath?: string | null;
  title: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // If we have a thumbnail URL and it hasn't errored, show image with blur-up
  if (thumbnailUrl && !error) {
    return (
      <div className={`relative overflow-hidden bg-muted/30 ${className}`}>
        {/* Blur placeholder */}
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse" />
        )}
        <img
          src={thumbnailUrl}
          alt={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-all duration-500 ${
            loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"
          }`}
        />
      </div>
    );
  }

  // Fallback: file type icon
  const { icon: Icon, label } = getFileTypeIcon(null, filePath);
  return (
    <div
      className={`flex items-center justify-center bg-muted/20 ${className}`}
    >
      <div className="text-center space-y-1">
        <Icon className="h-8 w-8 mx-auto text-muted-foreground/60" />
        <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}
