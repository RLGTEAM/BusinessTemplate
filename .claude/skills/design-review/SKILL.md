---
name: design-review
description: Judge a built client site against the design rubric: screenshot with a real browser, score distinctiveness/concept/color/typography/motion/craft/navigation/aliveness/mobile-craft, iterate targeted fixes (max 3 rounds), log verdicts to docs/design-review.md. Use after building or changing a client site's design, or when asked to review the design.
---

# Design review (the judge)

## Purpose

The mechanical gate (`npm run test` + `test:e2e` + `test:ltr-build`) proves the
site isn't broken. It says nothing about whether the site is bland. This skill
is the judge that closes that gap — it scores the REAL rendered site, not the
intentions in `docs/concept.md`. A site that passes every test and reads as
the reference template with new colors has not passed this review.

## Setup

```
npm run build
npm run preview
```

Preview serves on `:4321`; if occupied, `npm run preview -- --port 4323`. Use
the Playwright MCP browser tools, not a manual eyeball — mobile-first and
interactive, matching the doctrine's Craft bars (the phone is the primary
canvas, the header is a designed component):

1. `browser_navigate` to the preview URL.
2. `browser_resize` to `390x844` FIRST → `browser_take_screenshot` with
   `fullPage: true`, AND a viewport-sized screenshot of the hero.
3. `browser_click` the nav toggle (locate via `[aria-controls]`) →
   screenshot the OPEN mobile menu. If no `[aria-controls]` toggle exists on
   the page, do not error — record that absence as Navigation evidence (the
   axis scores 1). If a menu was opened, CLOSE it now — press Escape (or
   click the toggle again) — before moving to step 4; an open drawer left in
   the DOM corrupts the desktop screenshot.
4. `browser_resize` to `1280x900` → `browser_take_screenshot` with `fullPage: true`.
5. Read all screenshots before scoring anything — judge MOBILE evidence
   before desktop on every axis; the verdict is evidence-based.

Caveat: full-page screenshots downsample heavily on long pages. When judging
a specific band (color story, section treatment), take an additional
viewport-sized or element screenshot of that section.

Pass plain relative filenames to `browser_take_screenshot`, not absolute
paths — an absolute path containing non-ASCII characters (e.g. a Windows
project path with Hebrew folder segments) is rejected as outside the
allowed roots even when it's a literal subpath of one.

## Automatic fails

Any ONE of these fails the round regardless of scores:

1. **Starter shell present** — `src/pages/index.astro` still renders the
   starter-shell markup, or `content.shell` still exists in schema/JSON.
2. **All-default palette** — fails when ALL palette neutrals
   (surface/surfaceAlt/ink/inkMuted/line) are at schema defaults AND
   `src/styles/custom.css` contains no client-authored surface/color-story
   treatment — i.e. the client added no color story of their own.
3. **Zero bespoke motion** — fails when `src/lib/animation/custom.ts` is
   still the template no-op AND there is no `data-reveal` usage anywhere on
   the page. There are no stock sections any more — any reveal usage found is
   client-authored.
4. **Motion inventory incomplete** — any of the doctrine's five aliveness
   categories (Craft bar 3, `docs/DESIGN-DOCTRINE.md`) is missing, verified in
   code: `custom.ts` content, `data-reveal` preset variety (grep which
   presets are used), `helpers.ts` imports (`marquee`/`parallax`/`counter`),
   and CSS hover/focus/press transitions on interactive elements.

## Pre-check (before scoring)

Read `docs/concept.md`. It must contain, as written prose for the CHOSEN
concept, both the nav concept (`.claude/skills/new-client/SKILL.md` Step 1
item 6) and the choreography plan (item 7) — not just code that happens to
realize them. If either is missing or too thin to judge, cap **Concept
expression** at 2 regardless of what the rendered page shows, and say so
explicitly in this round's `docs/design-review.md` log entry.

## Fresh eyes

The agent that built the site scoring its own work tends to grade
generously — it already believes in the choices it just made. When an
agent-dispatch tool is available (e.g. this session's `Agent` tool), run the
scoring pass (automatic fails + scored rubric below) as a FRESH subagent
invocation that receives ONLY: this skill file, the screenshots just taken,
and the relevant code paths (`docs/concept.md`, `src/pages/index.astro`,
`src/lib/animation/custom.ts`, `src/styles/custom.css`) — not the building
session's own reasoning, rationale, or prior self-assessment. Treat its
verdict as authoritative; fold it into this session's log and fix/loop from
there. If no such tool is available, score inline but stay skeptical of your
own build.

## Scored rubric

Score each 1–5 with one line of evidence — cite what you SAW in a screenshot
or read in the code, never an assumption:

- **Distinctiveness** — would someone who has seen previous client sites (if
  known) and the generic AI-site look recognize this as a different site
  immediately? Check the anti-AI-tells list in `docs/DESIGN-DOCTRINE.md`'s
  Craft bars — 2 or more tells present caps this axis at 2.
- **Concept expression** — is the concept from `docs/concept.md` visible on
  the page (motifs, color story, composition), not just claimed in prose?
- **Color story** — do sections carry rhythm (light / tinted / dark
  variation)? Is the accent focused where it matters (usually the CTA), not
  scattered?
- **Typography** — does the pairing carry the concept? Warn if `handmade`
  (Amatic SC) carries long headings — it's display-only and turns illegible
  past a few words.
- **Motion evidence** — screenshots are static; judge this from code. Inspect
  `src/lib/animation/custom.ts` and grep `data-reveal` usage — is there ONE
  coherent motion identity, or default reveals with no signature?
- **Craft/coherence** — alignment, spacing, contrast comfort; does the page
  read as ONE design rather than a stack of independent sections?
- **Navigation** — is there a scroll-aware response past a threshold? is
  there active-section indication (`aria-current` plus a visible state, not
  color alone)? is the mobile drawer DESIGNED — judged from the open-menu
  screenshot, never assumed?
- **Aliveness** — density and coherence of the motion inventory: does the
  page feel alive in code evidence (choreographed hero timeline,
  scroll-driven moments, micro-interactions everywhere) while keeping ONE
  identity?
- **Mobile craft** — is the primary CTA thumb-reachable? does the type
  scale hold at 390 — check the mobile screenshot for truncation or
  horizontal-scroll artifacts? is there a sticky contact bar or equivalent
  always-reachable contact access?

**PASS bar**: no automatic fail, no score below 3, average ≥ 4 — now across
all 9 axes.

## The loop

On FAIL: pick the 2–3 highest-leverage fixes (not a redesign), apply them,
rebuild, re-shoot the Setup screenshots, re-score. Maximum 3 rounds total.
If the Pre-check capped Concept expression at 2 for missing nav-concept or
choreography prose in `docs/concept.md`, writing that prose IS fix #1 of the
round — do this even when invoked standalone (not via `/new-client`), so the
loop doesn't deadlock re-scoring code while the actual gap is undocumented
prose.

After every round (pass or not), append to `docs/design-review.md` — a
CLIENT-repo artifact; the template repo must never contain this file:

- Round number, screenshots taken (viewport + what they showed).
- Scores with their one-line evidence.
- Verdict (PASS/FAIL) and which automatic fails, if any, triggered.
- Fixes applied going into the next round.

If still failing after 3 rounds, say so plainly — in the log and in your
final report to whoever invoked this skill. Never quietly stop or claim a
pass that didn't happen.

## Rules

- Judging never edits the contract smoke suite.
- Fixes stay on the quality floor: new color-as-text pair → validator first
  (`scripts/validate-content.ts`), RTL logical properties only, reduced-motion
  still frame intact.
- Rerun `npm run test` after any fix round that touched code or content.
- Kill the preview server when the review concludes, pass or fail — find the
  process bound to the preview port and stop it, don't just close the
  browser tab. Windows/PowerShell: `Get-NetTCPConnection -LocalPort 4321 |
  Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process
  -Id $_ -Force }` (swap `4321` for whatever port Setup actually bound to,
  e.g. `4323` on a conflict) — or, simpler, just close the shell/terminal
  that ran `npm run preview`.
