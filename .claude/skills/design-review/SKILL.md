---
name: design-review
description: Judge a built client site against the design rubric: screenshot with a real browser, score distinctiveness/concept/color/typography/motion, iterate targeted fixes (max 3 rounds), log verdicts to docs/design-review.md. Use after building or changing a client site's design, or when asked to review the design.
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
the Playwright MCP browser tools, not a manual eyeball:

1. `browser_navigate` to the preview URL.
2. `browser_resize` to `1280x900`, `browser_take_screenshot` with `fullPage: true`.
3. `browser_resize` to `390x844`, `browser_take_screenshot` with `fullPage: true`.
4. Read both screenshots before scoring anything — the verdict is evidence-based.

Caveat: full-page screenshots downsample heavily on long pages. When judging
a specific band (color story, section treatment), take an additional
viewport-sized or element screenshot of that section.

## Automatic fails

Any ONE of these fails the round regardless of scores:

1. **Stock composition** — `src/pages/index.astro` order is still the
   reference default (Hero → Services → About → Testimonials → Gallery → FAQ
   → CTA → ContactForm) with every section at its stock variant.
2. **All-default palette** — fails when ALL palette neutrals
   (surface/surfaceAlt/ink/inkMuted/line) are at schema defaults AND
   `src/styles/custom.css` contains no client-authored surface/color-story
   treatment — i.e. the client added no color story of their own. What stock
   components ship (including the stock CTA's dark gradient) doesn't count.
3. **Unskinned footer** — `Footer.astro` renders stock: no palette, no
   `custom.css`, no markup change reaches it.
4. **Zero bespoke motion** — fails when `src/lib/animation/custom.ts` is
   still the template no-op AND the client added no reveal choices of their
   own (no `data-reveal` attributes/presets beyond what the stock reference
   sections — Hero/About/CTA — already ship). Stock sections' built-in
   presets don't count as bespoke motion.

## Scored rubric

Score each 1–5 with one line of evidence — cite what you SAW in a screenshot
or read in the code, never an assumption:

- **Distinctiveness** — would someone who has seen the reference template
  recognize this as a different site immediately?
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

**PASS bar**: no automatic fail, no score below 3, average ≥ 4.

## The loop

On FAIL: pick the 2–3 highest-leverage fixes (not a redesign), apply them,
rebuild, re-shoot both viewports, re-score. Maximum 3 rounds total.

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
- Kill the preview server when the review concludes, pass or fail.
