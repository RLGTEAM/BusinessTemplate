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

/*
 * Phone/WhatsApp format validation.
 *
 * telHref() (src/lib/business.ts) assumes any phone digit-string starting
 * with "0" is Israeli local format and strips it in favor of a "+972"
 * prefix; anything else is assumed to already be an international number
 * and just gets a "+" prepended. A mis-formatted phone (e.g. missing the
 * leading 0) silently produces a real-looking but WRONG country code on the
 * tel: link with no build-time signal — this check catches that class of
 * mistake before it ships. The same rules — and the same telHref() call —
 * apply to legal.accessibility.coordinator.phone on the accessibility
 * statement page, so it's checked with the identical function below.
 */
function validatePhone(label: string, value: string): void {
  const digits = value.replace(/\D/g, "");
  const isIsraeliLocal = /^0\d{8,9}$/.test(digits);
  const isInternational = /^972\d{8,9}$/.test(digits);

  if (!isIsraeliLocal && !isInternational) {
    console.error(`\n✗ ${label} ("${value}") is not a recognized phone format.\n`);
    console.error(
      '  telHref() assumes a leading 0 means Israeli local format and prefixes "+972" for any\n' +
        "  other digit string — a mis-formatted number (e.g. a missing leading 0) silently produces\n" +
        "  a wrong (but valid-looking) country code on the tel: link (star codes like *3455 and\n" +
        "  1-800 numbers aren't supported by telHref — use a standard number here).\n",
    );
    console.error(
      "  Use Israeli local format (0 + 8-9 digits, e.g. 050-000-0000) or international (972 + 8-9 digits).",
    );
    process.exit(1);
  }
}

validatePhone("data.contact.phone", result.data.data.contact.phone);
validatePhone(
  "content.legal.accessibility.coordinator.phone",
  result.data.content.legal.accessibility.coordinator.phone,
);

const whatsapp = result.data.data.contact.whatsapp;
if (!/^972\d{8,9}$/.test(whatsapp)) {
  console.error(`\n✗ data.contact.whatsapp ("${whatsapp}") is not a valid international number.\n`);
  console.error(
    "  whatsappHref() uses this value verbatim as a wa.me path, which requires the full\n" +
      '  country code with no leading "0" and no symbols — it must match 972 followed by\n' +
      '  8-9 digits (e.g. "972501234567"). Anything else — a local-format leading 0, a missing\n' +
      "  or wrong country code, punctuation — produces a broken wa.me link.",
  );
  process.exit(1);
}

console.log("✓ contact phone/whatsapp formats are valid");
