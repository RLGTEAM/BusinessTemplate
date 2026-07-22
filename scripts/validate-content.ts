/**
 * Standalone business.json validation (also enforced at build time via the
 * content collection schema). Run with: npm run validate:content
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { businessSchema } from "../src/content/business.schema";

const jsonPath = fileURLToPath(new URL("../src/content/business/business.json", import.meta.url));

const raw: unknown = JSON.parse(readFileSync(jsonPath, "utf-8").replace(/^﻿/, ""));
const result = businessSchema.safeParse(raw);

if (!result.success) {
  console.error("✗ business.json is invalid:\n");
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

console.log("✓ business.json is valid");

/*
 * WCAG contrast validation for voice.palette.
 *
 * The template only ever uses brand colors as text/background in these pairs
 * (see AGENTS.md → "Palette contract"), so a palette passing here is safe for
 * every component. Neutral values mirror the static tokens in
 * src/styles/global.css — keep them in sync.
 */
const NEUTRALS = {
  surface: "#faf9f7",
  surfaceAlt: "#f1eeea",
};

const MIN_TEXT_CONTRAST = 4.5; // WCAG AA, normal text

function luminance(hex: string): number {
  const channel = (i: number): number => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const { palette } = result.data.voice;
const pairs: Array<{ label: string; a: string; b: string; usage: string }> = [
  {
    label: "primary ↔ surface",
    a: palette.primary,
    b: NEUTRALS.surface,
    usage: "prices/link text on light bg; light text on primary buttons",
  },
  {
    label: "secondary ↔ surface",
    a: palette.secondary,
    b: NEUTRALS.surface,
    usage: "headings on light bg; light text on footer",
  },
  {
    label: "secondary ↔ surface-alt",
    a: palette.secondary,
    b: NEUTRALS.surfaceAlt,
    usage: "headings/labels on alternate section bg",
  },
  {
    label: "accent ↔ secondary",
    a: palette.accent,
    b: palette.secondary,
    usage: "CTA button text on accent bg",
  },
];

const failures = pairs
  .map((pair) => ({ ...pair, ratio: contrast(pair.a, pair.b) }))
  .filter((pair) => pair.ratio < MIN_TEXT_CONTRAST);

if (failures.length > 0) {
  console.error(`\n✗ voice.palette fails WCAG AA contrast (need ≥ ${MIN_TEXT_CONTRAST}:1):\n`);
  for (const f of failures) {
    console.error(
      `  ${f.label}: ${f.ratio.toFixed(2)}:1 (${f.a} vs ${f.b}) — used for: ${f.usage}`,
    );
  }
  console.error("\n  Adjust the palette in business.json until every pair passes.");
  process.exit(1);
}

console.log("✓ palette passes WCAG AA contrast on all used pairs");
