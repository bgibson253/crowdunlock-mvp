import DOMPurify from "isomorphic-dompurify";

// For chat, we keep it text-only. Still sanitize to avoid edge cases.
export function sanitizeChatText(input: string) {
  const trimmed = input.replace(/\s+/g, " ").trim().slice(0, 500);
  const clean = DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return clean;
}
