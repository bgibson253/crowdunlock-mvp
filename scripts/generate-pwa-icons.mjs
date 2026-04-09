#!/usr/bin/env node
// scripts/generate-pwa-icons.mjs
// Generates 192x192 and 512x512 PNG icons for PWA manifest using sharp (bundled with Next.js)

import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

for (const size of [192, 512]) {
  const rx = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.55);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#bg)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">U</text>
</svg>`;

  const filepath = join(iconsDir, `icon-${size}.png`);
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(filepath);

  console.log(`✅ Generated ${filepath}`);
}

// Also generate apple-touch-icon (180x180)
const appleSize = 180;
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${appleSize}" height="${appleSize}" viewBox="0 0 ${appleSize} ${appleSize}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${appleSize}" height="${appleSize}" rx="36" fill="url(#bg)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="bold" font-size="99" fill="white">U</text>
</svg>`;

await sharp(Buffer.from(appleSvg))
  .resize(appleSize, appleSize)
  .png()
  .toFile(join(iconsDir, "apple-touch-icon.png"));

console.log("✅ Generated apple-touch-icon.png");
