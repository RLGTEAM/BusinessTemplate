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
clients if known. Pick the strongest.

The chosen concept MUST specify, binding for every build:

1. A bespoke hero treatment — not a stock `Hero` variant left untouched.
2. At least one fully bespoke section (not a reference section with props
   changed).
3. A signature motion implemented in `src/lib/animation/custom.ts`
   (`registerCustomAnimations`) — not just default `data-reveal` presets.
4. A non-default color story: the page cannot ship all-default-white
   surfaces unless `docs/concept.md` explicitly argues why light-minimal
   serves THIS client.
5. A composition order different from the reference default (Hero →
   Services → About → Testimonials → Gallery → FAQ → CTA → ContactForm).

Write `docs/concept.md` containing the
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

`voice.palette` drives the theme, including the neutrals: `surface`,
`surfaceAlt`, `ink`, `inkMuted`, `line` — schema defaults are the reference
light theme, but a dark or deep-tinted site is a first-class choice, not a
workaround. `npm run validate:content` enforces WCAG AA (≥ 4.5:1) on all 9
pairs the template actually uses (ink/ink-muted × surface/surface-alt,
primary/secondary × surface/surface-alt, accent↔secondary) against the REAL
palette values. If a brand color fails, adjust until it passes and note the
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
- Motion: the concept's ONE motion identity. Default entrances via
  `data-reveal` choices, tuned with `data-reveal-duration` /
  `data-reveal-delay` / `data-reveal-distance` / `data-reveal-start` (and
  `data-reveal-stagger` on groups); the `blur` and `clip` presets are the two
  sanctioned exceptions to transforms/opacity-only. Bespoke motion goes in
  `registerCustomAnimations()` in `src/lib/animation/custom.ts` — the entry
  point called inside the reduced-motion-guarded matchMedia context.
- New user-visible behavior → ADD a test in the client repo. The contract
  smoke suite is never edited.

## Step 5 — Images + OG

Client photos into `src/assets/images/` (keep filenames or update refs).
Regenerate: `npm run generate:og`. Every image still showing a placeholder
goes in the report.

## Step 5.5 — Design review (the judge)

Invoke the `design-review` skill against the built site. It owns the rubric
and the automatic-fail checks — do not inline them here. The build must reach
PASS, or exhaust the skill's 3 rounds with every round's verdict logged to
`docs/design-review.md`, before moving to the final gate. A site that hasn't
run through this skill isn't finished, even if Step 6 is green.

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
