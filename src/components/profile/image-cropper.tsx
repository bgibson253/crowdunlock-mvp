"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

async function getCroppedImg(
  imageSrc: string,
  crop: Area,
  outputWidth?: number
): Promise<Blob> {
  // Use createImageBitmap to avoid EXIF rotation issues and get true pixel data
  const response = await fetch(imageSrc);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  // Determine output size — scale to outputWidth if provided, else use crop pixel size
  const scale = outputWidth ? outputWidth / crop.width : 1;
  const outW = Math.round(crop.width * scale);
  const outH = Math.round(crop.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    bitmap,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH
  );

  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.92
    );
  });
}

interface ImageCropperProps {
  imageSrc: string;
  aspect: number; // e.g. 1 for avatar (square), 3 for banner
  outputWidth?: number; // target output width in px (e.g. 1200 for banner)
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
  title?: string;
}

export function ImageCropper({ imageSrc, aspect, outputWidth, onCropComplete, onCancel, title }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropAreaChange = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  async function handleApply() {
    if (!croppedArea) return;
    const blob = await getCroppedImg(imageSrc, croppedArea, outputWidth);
    onCropComplete(blob);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
          <h3 className="text-sm font-bold">{title ?? "Crop image"}</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cancel">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cropper area */}
        <div className="relative w-full" style={{ height: 340 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropAreaChange}
            cropShape="rect"
            showGrid={false}
            style={{
              containerStyle: { background: "oklch(0.1 0.015 260)" },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 py-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary h-1"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={onCancel} className="border-border/50">
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
