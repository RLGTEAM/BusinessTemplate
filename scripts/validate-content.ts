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
 * Cross-field content checks. Unlike the schema (shape) and the palette
 * (contrast), these are rules about VALUES — all failures are collected and
 * reported together so one run shows everything that needs fixing.
 *
 * Phones: dialablePhone() (src/lib/business.ts) assumes any digit-string
 * starting with "0" is Israeli local format and strips it in favor of a
 * "+972" prefix; anything else is assumed to already be international and
 * just gets a "+" prepended. A mis-formatted phone (e.g. missing the
 * leading 0) silently produces a real-looking but WRONG country code on the
 * tel: link with no build-time signal — this check catches that class of
 * mistake before it ships. Star codes ("*3455") pass through unchanged.
 * The same rules apply to legal.accessibility.coordinator.phone on the
 * accessibility statement page. (whatsapp format is enforced by the schema.)
 */
const errors: string[] = [];

function checkPhone(label: string, value: string): void {
  const trimmed = value.trim();
  // Israeli star codes are dialable as-is — dialablePhone() keeps them verbatim.
  if (/^\*\d{3,6}$/.test(trimmed)) return;
  const digits = trimmed.replace(/\D/g, "");
  const isIsraeliLocal = /^0\d{8,9}$/.test(digits);
  const isInternational = /^972\d{8,9}$/.test(digits);

  if (!isIsraeliLocal && !isInternational) {
    errors.push(
      `${label} ("${value}") is not a recognized phone format.\n` +
        '    dialablePhone() assumes a leading 0 means Israeli local format and prefixes "+972"\n' +
        "    for any other digit string — a mis-formatted number silently produces a wrong\n" +
        "    (but valid-looking) country code on the tel: link. Use Israeli local format\n" +
        "    (0 + 8-9 digits), international (972 + 8-9 digits), or a star code (*3455).",
    );
  }
}

checkPhone("data.contact.phone", result.data.data.contact.phone);
checkPhone(
  "content.legal.accessibility.coordinator.phone",
  result.data.content.legal.accessibility.coordinator.phone,
);

// Hours: the schema validates HH:MM shape; the cross-field rules live here.
// open > close is allowed within a range (a bar open past midnight) — only
// open === close is unrepresentable (a 24h business uses "00:00"–"23:59",
// a closed day uses an empty ranges array).
function checkRanges(label: string, ranges: Array<{ open: string; close: string }>): void {
  for (const r of ranges) {
    if (r.open === r.close) {
      errors.push(
        `${label}: open and close are both "${r.open}" — a zero-length range is invalid ` +
          '(24h = "00:00"–"23:59"; closed = an empty ranges array).',
      );
    }
  }
}

const seenDays = new Set<string>();
for (const h of result.data.data.hours) {
  if (seenDays.has(h.day)) {
    errors.push(`data.hours: duplicate entry for ${h.day} — each day may appear once.`);
  }
  seenDays.add(h.day);
  checkRanges(`data.hours (${h.day})`, h.ranges);
}

// Dates: the schema regex allows impossible dates like 2026-13-45.
function isRealDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

for (const special of result.data.data.specialHours) {
  if (!isRealDate(special.date)) {
    errors.push(`data.specialHours ("${special.label}"): "${special.date}" is not a real date.`);
  }
  checkRanges(`data.specialHours (${special.date})`, special.ranges);
}

const legalDates: Array<[string, string]> = [
  [
    "content.legal.accessibility.statementDate",
    result.data.content.legal.accessibility.statementDate,
  ],
  ["content.legal.accessibility.auditDate", result.data.content.legal.accessibility.auditDate],
  ["content.legal.privacy.statementDate", result.data.content.legal.privacy.statementDate],
];
for (const [label, value] of legalDates) {
  if (!isRealDate(value)) {
    errors.push(`${label} ("${value}") is not a real calendar date.`);
  }
}

if (errors.length > 0) {
  console.error("\n✗ business.json content checks failed:\n");
  for (const e of errors) {
    console.error(`  ${e}\n`);
  }
  process.exit(1);
}

console.log("✓ contact phone formats, hours, and dates are valid");
