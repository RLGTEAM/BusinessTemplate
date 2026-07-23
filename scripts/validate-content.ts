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
 * Pairs are computed against the ACTUAL palette (neutrals included, schema
 * defaults applied) — dark themes are validated for real. `line` is
 * border-only decoration, not text, so it is deliberately not
 * contrast-checked. See AGENTS.md → "Palette contract".
 */
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

const p = result.data.voice.palette;
const pairs: Array<{ label: string; a: string; b: string; usage: string }> = [
  { label: "ink ↔ surface", a: p.ink, b: p.surface, usage: "body copy on the base background" },
  {
    label: "ink ↔ surface-alt",
    a: p.ink,
    b: p.surfaceAlt,
    usage: "body copy on alternate sections",
  },
  { label: "ink-muted ↔ surface", a: p.inkMuted, b: p.surface, usage: "muted/secondary text" },
  {
    label: "ink-muted ↔ surface-alt",
    a: p.inkMuted,
    b: p.surfaceAlt,
    usage: "muted text on alternate sections",
  },
  {
    label: "primary ↔ surface",
    a: p.primary,
    b: p.surface,
    usage: "links/prices on base bg; surface text on primary buttons",
  },
  {
    label: "primary ↔ surface-alt",
    a: p.primary,
    b: p.surfaceAlt,
    usage: "primary-colored text on alternate sections",
  },
  {
    label: "secondary ↔ surface",
    a: p.secondary,
    b: p.surface,
    usage:
      "headings on base bg; symmetric, so also covers text-surface on bg-secondary (footer, skip link)",
  },
  {
    label: "secondary ↔ surface-alt",
    a: p.secondary,
    b: p.surfaceAlt,
    usage: "headings/labels on alternate bg",
  },
  {
    label: "accent ↔ secondary",
    a: p.accent,
    b: p.secondary,
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
