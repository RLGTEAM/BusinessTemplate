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
- Geo coordinates (`data.contact.geo.lat`/`.lng`): if the brief has no
  `[client-confirmed]` coordinates, geocode the real address yourself
  (WebSearch — e.g. look it up on Google Maps and read the lat/lng off the
  pin) and tag the result `[scraped]`/provisional in Step 7's
  confirm-with-client list. NEVER leave the skeleton's demo coordinates in
  place — they validate fine but silently ship a wrong map pin in the
  LocalBusiness JSON-LD for a real business.
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

1. A bespoke hero treatment — a hero designed for this client, not a generic centered-headline default.
2. At least one fully bespoke section.
3. A signature motion implemented in `src/lib/animation/custom.ts`
   (`registerCustomAnimations`) — not just default `data-reveal` presets.
4. A non-default color story: the page cannot ship all-default-white
   surfaces unless `docs/concept.md` explicitly argues why light-minimal
   serves THIS client.
5. No shell markup / `content.shell` remains.
6. A **nav concept**: how the header expresses the concept, its scroll-aware
   behavior, and the mobile drawer's design — not just the a11y mechanics
   (RECIPES covers the mechanism; the design is the concept's job).
7. A **choreography plan**: the doctrine's five-part aliveness inventory
   (Craft bar 3, `docs/DESIGN-DOCTRINE.md`) mapped to actual sections — which
   section gets which scroll-driven moment, what the hero timeline
   sequences, what the ambient motion is, what the micro-interaction
   character is.

Sketch concept candidates MOBILE-FIRST: describe the 390px composition
first, desktop as the adaptation.

Write `docs/concept.md` containing the
chosen concept in full plus the two rejected candidates with one line each on
why they lost. Commit it alone: `feat: design concept for <client>`.

## Step 2 — Schema-first content

- `data` + `voice` + the frozen content core (`nav`, `ui`, `consent`,
  `notFound`, `legal`): fill completely, never reshape.
- Author the per-client content region from scratch (only canonical optional
  `faq` is predefined): reshape `business.schema.ts` to match the page you
  designed in Step 1, then write the JSON. Copy NEVER lives in components.
  (`content.shell` is deleted in Step 4, in the same change that replaces
  `index.astro` — not here; the starter page throws if `shell` is missing
  while it's still the page rendering.)
- `legal.accessibility.coordinator` needs REAL details (legal requirement,
  ת"י 5568). If the brief lacks them, use a placeholder AND flag it as
  BLOCKING — first line of the final report.
- Trackers only if explicitly requested (auto-enables consent banner; rewrite
  `legal.privacy` to disclose them).
- Author ALL `content` copy in `business.locale`'s language — the bidi test
  line below is the one deliberate, isolated exception. Hebrew sites keep a
  bidi test line (Hebrew + Latin name + ₪ price) in visible body copy — the
  smoke suite scans for it. Make it read as real copy the client's own
  business would plausibly say, not an inserted fixture — e.g. a menu/product
  line naming something with a genuine Latin brand name at a real ₪ price
  ("מנת ה-Signature Burger שלנו ב-₪68"), built from whatever the client's
  actual business supports (an imported product, a partner brand, a
  delivery-app mention) — never a sentence invented purely to pass the test.
- Respect `voice` in every sentence. Save UTF-8 WITHOUT BOM.
- Sweep: `rg '\[[^0-9"][^"]*\]' src/content/business/business.json` — only
  deliberate flagged placeholders may remain, and every one of them goes in
  the report. (The bidi line is real copy and contains no brackets. Don't use
  a bare `rg "\["` — it matches every JSON array opening.)

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

- Build order is mobile-first: compose at 390, then adapt up — never
  desktop-first.
- Compose `src/pages/index.astro` yourself, replacing the starter shell
  entirely, and in the SAME change DELETE `content.shell` from schema+JSON
  (the starter page throws if `shell` is missing while it's still the page
  rendering — deleting both together avoids a spurious build failure).
  Build every component from zero. Consult `docs/RECIPES.md` for
  the RTL/a11y-correct patterns (nav, form contract, section skeleton) —
  recipe 7 (scroll-aware header) and recipe 9 (mobile sticky contact bar)
  are mandatory for the Craft bars above, not optional polish.
  Forms are optional — only if the client wants one, wired to the headless
  helper.
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
- Before Step 5.5, SELF-CHECK the aliveness inventory and the anti-AI-tells
  list (Craft bars 3 and 4, `docs/DESIGN-DOCTRINE.md`) and fix any gaps — the
  judge automatic-fails an incomplete inventory.
- Also before Step 5.5, verify `docs/concept.md` actually contains the nav
  concept (Step 1 item 6) and the choreography plan (item 7) for the chosen
  concept AS WRITTEN PROSE, not just realized in code — design-review caps
  Concept expression at 2 if either is missing.

## Step 5 — Images + OG

Client photos into `src/assets/images/`; add image fields to the client schema
as the design needs (schema-first, resolved via `resolveImage()` per
`docs/RECIPES.md` recipe 5). Regenerate the OG image + favicon/icon set:
`npm run generate:og`. Every image still showing a placeholder goes in the
report.

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
   price / hours fact, verbatim, plus any unverified/geocoded geo
   coordinates (Step 0).
3. **Placeholders remaining** — images, testimonials, copy awaiting real
   content.
4. **Design decisions** — the concept (link `docs/concept.md`), palette
   adjustments, fontPairing, composition summary.
5. **Deploy checklist** — `data.seo.siteUrl` matches the real domain (it drives
   canonical URLs, sitemap, JSON-LD, and the Cloudflare Pages project name);
   `PUBLIC_WEB3FORMS_KEY` is in the local `.env`, created with the CLIENT's
   email (direct uploads build locally — a dashboard-only key never ships);
   then `npx wrangler login` → `npm run deploy:setup` → `npm run deploy:preview`.
   Do NOT run any deploy command yourself — list them for the operator.
