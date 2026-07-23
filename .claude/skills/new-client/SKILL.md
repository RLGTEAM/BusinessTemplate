---
name: new-client
description: Build a client site 0→100 from a brief — concept generation + self-critique → schema-first content → bespoke page design → validation → full test gate. Runs autonomously without stopping for input. Use when starting a new client site, rebranding one, or applying a client brief.
---

# New client build (autonomous)

Turn `docs/brief.md` into a designed, validated site. Run WITHOUT stopping for
user input: make the best call, record it, and surface every assumption in the
final report. Read `docs/DESIGN-DOCTRINE.md` first — it is the contract for
everything below (the floor, the page contract, the toolkit, the process).

## Step 0 — Ingest the brief

- Facts are tagged `[scraped]` or `[client-confirmed]`. Scraped-only NAP,
  prices, and hours are PROVISIONAL: use them, and list each in the final
  report under "confirm with client before launch".
- Missing required facts: do NOT stall. Insert a clearly-marked placeholder
  and add it to the report's blocking list.
- The "raw texture" section is your design material — read it before
  inventing anything. The concept must come from the client's world, not from
  a generic industry stereotype.

## Step 1 — Concept (before any code)

Generate THREE distinct concept candidates in the doctrine's four-line format
(metaphor / color story / composition / motion identity + still frame).
Self-critique each against: (a) would this client's customers recognize it
instantly, (b) feasibility on the floor (contrast pairs, RTL, reduced-motion
still frame), (c) distance from the reference-template look and from previous
clients if known. Pick the strongest. Write `docs/concept.md` containing the
chosen concept in full plus the two rejected candidates with one line each on
why they lost. Commit it alone: `feat: design concept for <client>`.

## Step 2 — Schema-first content

- `data` + `voice` + the frozen content core (`nav`, `ui`, `consent`,
  `notFound`, `legal`): fill completely, never reshape.
- The per-client `content` region: reshape `business.schema.ts` to match the
  page you designed in Step 1, then write the JSON. Copy NEVER lives in
  components.
- `legal.accessibility.coordinator` needs REAL details (legal requirement,
  ת"י 5568). If the brief lacks them, use a placeholder AND flag it as
  BLOCKING — first line of the final report.
- Trackers only if explicitly requested (auto-enables consent banner; rewrite
  `legal.privacy` to disclose them).
- Hebrew sites keep a bidi test line (Hebrew + Latin name + ₪ price) in
  visible body copy — the smoke suite scans for it.
- Respect `voice` in every sentence. Save UTF-8 WITHOUT BOM.
- Sweep: `rg "\[" src/content/business/business.json` — only the bidi line
  and deliberate flagged placeholders may remain, and every one of the
  latter goes in the report.

## Step 3 — Palette

`voice.palette` drives the theme. `npm run validate:content` enforces WCAG AA
(≥ 4.5:1) on primary↔surface, secondary↔surface, secondary↔surface-alt,
accent↔secondary. If a brand color fails, adjust until it passes and note the
change in the report. New color-as-text pairs → add to
`scripts/validate-content.ts` in the same commit.

## Step 4 — Design and build the page

Execute the committed concept, 0→100:

- Compose `src/pages/index.astro` yourself. Reference sections
  (`src/components/sections/`) are examples: use as-is with their variant
  props, gut and redesign, or replace with bespoke sections.
- Shape/rhythm: override `--shape-radius-card`, `--shape-radius-button`,
  `--section-py` in `src/styles/custom.css`; color story with tokens +
  `color-mix()` there too. Pick `design.fontPairing` to match the concept.
- Honor the page contract: one `h1`, nav `#id` links all resolve, footer with
  legal links, contact path reachable, decorative = `aria-hidden` +
  `pointer-events-none`.
- Motion: the concept's ONE motion identity via `data-reveal` choices and, if
  needed, a `setup*()` registered inside the matchMedia context in
  `src/lib/animation/index.ts`.
- New user-visible behavior → ADD a test in the client repo. The contract
  smoke suite is never edited.

## Step 5 — Images + OG

Client photos into `src/assets/images/` (keep filenames or update refs).
Regenerate: `npm run generate:og`. Every image still showing a placeholder
goes in the report.

## Step 6 — Gate (all must pass; fix, don't skip)

```
npm run validate:content
npm run test
npm run test:e2e
npm run test:ltr-build
npx playwright test --grep @visual --update-snapshots
npm run test:visual
```

## Step 7 — Report

End with exactly these sections:

1. **BLOCKING** — placeholder accessibility coordinator, missing legal facts.
2. **Confirm with client before launch** — every `[scraped]`-only NAP /
   price / hours fact, verbatim.
3. **Placeholders remaining** — images, testimonials, copy awaiting real
   content.
4. **Design decisions** — the concept (link `docs/concept.md`), palette
   adjustments, fontPairing, composition summary.
5. **Deploy checklist** — Cloudflare Pages + `PUBLIC_WEB3FORMS_KEY` (created
   with the CLIENT's email) + `data.seo.siteUrl` matches the domain.
