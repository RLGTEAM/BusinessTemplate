/**
 * Generates public/og-default.png (1200×630) from business.json — client name,
 * tagline, and brand palette. Run after filling business.json for a new client:
 *   npm run generate:og
 *
 * Uses sharp (ships with Astro). Text renders with system fonts (Arial supports
 * Hebrew everywhere); replace the file with a designed image whenever one exists.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { businessSchema } from "../src/content/business.schema";

const root = new URL("..", import.meta.url);
const jsonPath = fileURLToPath(new URL("src/content/business/business.json", root));
const raw: unknown = JSON.parse(readFileSync(jsonPath, "utf-8").replace(/^﻿/, ""));
const business = businessSchema.parse(raw);

const { name, tagline } = business.data;
const { primary, secondary, accent } = business.voice.palette;

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${secondary}"/>
      <stop offset="1" stop-color="${primary}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="120" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="120" cy="560" r="280" fill="#000000" opacity="0.10"/>
  <rect x="560" y="400" width="80" height="6" rx="3" fill="${accent}"/>
  <text x="600" y="310" text-anchor="middle" direction="${business.locale === "he" ? "rtl" : "ltr"}"
    font-family="Heebo, Arial, sans-serif" font-size="88" font-weight="700" fill="#ffffff">
    ${escapeXml(name)}
  </text>
  <text x="600" y="480" text-anchor="middle" direction="${business.locale === "he" ? "rtl" : "ltr"}"
    font-family="Heebo, Arial, sans-serif" font-size="40" fill="#ffffff" opacity="0.85">
    ${escapeXml(tagline)}
  </text>
</svg>`;

const target = fileURLToPath(new URL(`public/${business.data.seo.ogImage}`, root));
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(target);
console.log(`✓ ${business.data.seo.ogImage} generated (1200×630) for "${name}"`);

// Favicon: brand-gradient tile with the business initial (SVG scales to any size).
const initial = escapeXml([...name.trim()][0] ?? "•");
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <title>${escapeXml(name)}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${secondary}"/>
      <stop offset="1" stop-color="${primary}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <text x="32" y="44" text-anchor="middle" font-family="Heebo, Arial, sans-serif"
    font-size="34" font-weight="700" fill="#ffffff">${initial}</text>
</svg>`;
writeFileSync(fileURLToPath(new URL("public/favicon.svg", root)), favicon);
console.log(`✓ favicon.svg generated ("${initial}")`);
