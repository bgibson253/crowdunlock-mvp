import {
  FileText,
  Film,
  Database,
  Image as ImageIcon,
  Music,
  FileCode,
  File,
} from "lucide-react";

const FILE_TYPE_ICONS: Record<string, { icon: typeof FileText; label: string }> = {
  // Images
  "image/jpeg": { icon: ImageIcon, label: "Image" },
  "image/png": { icon: ImageIcon, label: "Image" },
  "image/gif": { icon: ImageIcon, label: "Image" },
  "image/webp": { icon: ImageIcon, label: "Image" },
  "image/svg+xml": { icon: ImageIcon, label: "Image" },
  // Video
  "video/mp4": { icon: Film, label: "Video" },
  "video/webm": { icon: Film, label: "Video" },
  "video/quicktime": { icon: Film, label: "Video" },
  // Audio
  "audio/mpeg": { icon: Music, label: "Audio" },
  "audio/wav": { icon: Music, label: "Audio" },
  "audio/ogg": { icon: Music, label: "Audio" },
  // Documents
  "application/pdf": { icon: FileText, label: "Document" },
  "text/plain": { icon: FileText, label: "Document" },
  "text/markdown": { icon: FileText, label: "Document" },
  // Data
  "application/json": { icon: Database, label: "Data" },
  "text/csv": { icon: Database, label: "Data" },
  // Code
  "text/html": { icon: FileCode, label: "Code" },
  "application/javascript": { icon: FileCode, label: "Code" },
};

const EXT_ICONS: Record<string, { icon: typeof FileText; label: string }> = {
  jpg: { icon: ImageIcon, label: "Image" },
  jpeg: { icon: ImageIcon, label: "Image" },
  png: { icon: ImageIcon, label: "Image" },
  gif: { icon: ImageIcon, label: "Image" },
  webp: { icon: ImageIcon, label: "Image" },
  svg: { icon: ImageIcon, label: "Image" },
  mp4: { icon: Film, label: "Video" },
  webm: { icon: Film, label: "Video" },
  mov: { icon: Film, label: "Video" },
  mp3: { icon: Music, label: "Audio" },
  wav: { icon: Music, label: "Audio" },
  ogg: { icon: Music, label: "Audio" },
  pdf: { icon: FileText, label: "Document" },
  txt: { icon: FileText, label: "Document" },
  md: { icon: FileText, label: "Document" },
  json: { icon: Database, label: "Data" },
  csv: { icon: Database, label: "Data" },
  html: { icon: FileCode, label: "Code" },
  js: { icon: FileCode, label: "Code" },
  ts: { icon: FileCode, label: "Code" },
};

/**
 * Get icon component and label for a file based on MIME type or file path extension.
 */
export function getFileTypeIcon(mimeType?: string | null, filePath?: string | null) {
  // Try by MIME type first
  if (mimeType && FILE_TYPE_ICONS[mimeType]) {
    return FILE_TYPE_ICONS[mimeType];
  }

  // Fallback to extension
  if (filePath) {
    const ext = filePath.split(".").pop()?.toLowerCase();
    if (ext && EXT_ICONS[ext]) {
      return EXT_ICONS[ext];
    }
  }

  return { icon: File, label: "File" };
}
