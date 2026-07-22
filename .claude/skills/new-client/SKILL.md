---
name: new-client
description: Fill this template for a new client end-to-end — interview/brief → business.json → theme + OG image → validation → full test gate. Use when starting a new client site, rebranding an existing one, or when the user provides a client brief to apply.
---

# New client setup

Turn a client brief into a finished, validated site. Everything flows through
`src/content/business/business.json` — never edit copy, colors, or contact info anywhere else.

## Step 0 — Gather the brief

If any of these are missing, ask before writing anything:

- Business: name, legal name, what they do, address, phone, email, WhatsApp number
- Offering: 3–6 services with prices (or "hide price")
- Hours, service areas, socials
- Voice: tone, formality, 3–5 keywords, words to avoid, CTA style
- Brand colors if they exist (otherwise propose a palette that fits the mood)
- Production domain (drives `data.seo.siteUrl`)
- Language: `he` (RTL) or `en` (LTR)

## Step 1 — Schema first

Read `src/content/business.schema.ts` before writing JSON. If the brief needs a field that
doesn't exist, extend the schema first, then the JSON. Never add unvalidated fields.

## Step 2 — Write business.json

- The shipped file is a `[bracketed]` placeholder skeleton — replace EVERY placeholder in
  `data`, `voice`, and `content`, including nav labels, form labels, FAQ, testimonials
  (mark clearly if awaiting real ones), footer strings, `notFound`, and `legal`.
  A fully-filled reference: `docs/examples/demo-salon.business.json`.
- `legal.accessibility.coordinator` needs the client's REAL accessibility coordinator
  (name/phone/email) and today's date in `statementDate` — this page is a legal requirement
  in Israel. `legal.privacy` should reflect what the form actually collects.
- Trackers: only set `analytics.gtagId` / `metaPixelId` if the client explicitly wants
  GA4/Meta Pixel — this auto-enables the consent banner (strings in `content.consent`,
  keep them in the client's voice). If enabled, REWRITE `legal.privacy` to disclose the
  tracker; the default text claims the site is cookieless.
- Final sweep: `rg "\[" src/content/business/business.json` — only the bidi test line may remain.
- Respect `voice`: tone/formality/doNotSay apply to every sentence you write.
- Keep the bidi test line pattern in `content.about.body` when locale is `he`
  (Hebrew + Latin name + phone + ₪ price) — the smoke test asserts it renders.
- **Windows caveat: save as UTF-8 WITHOUT BOM** — a BOM breaks the build.

## Step 3 — Palette

`voice.palette` drives the entire theme. Constraints (enforced by `npm run validate:content`):

- primary↔surface, secondary↔surface, secondary↔surface-alt, accent↔secondary
  must all be ≥ 4.5:1 (WCAG AA). Dark secondary + mid-dark primary + warm light accent
  is the shape that usually works.
- If the client's brand color fails, darken/lighten it until it passes and note the change.

## Step 3.5 — Design variants (make it look like a different site)

Set the `design` block so this client does NOT share a skeleton with previous clients:

- Pick `fontPairing`, `hero`, `shape` to match the brief's mood — e.g. lawyer/clinic →
  elegant or editorial + centered + sharp; fitness/food → modern or bold + full-bleed +
  rounded; boutique/care → warm or classic + split + pill.
- Pick `density` (airy = premium/calm, compact = practical/dense), `servicesLayout`
  (cards = equal offerings, list = menu/price-list feel, panels = few flagship services),
  and `galleryLayout` (grid = uniform, masonry = organic/craft, featured = one hero shot).
- Shuffle `sectionOrder` meaningfully (e.g. testimonials-first for trust-driven businesses,
  gallery-first for visual ones). Keep `contact` last or second-to-last; keep `content.nav`
  order consistent with the section order.
- If other client sites are known (ask the user which combos are already in use), choose a
  combination that differs in at least three axes overall.

## Step 3.75 — Creative concept + signature moment

Before touching images, propose ONE bold creative concept drawn from the client's world —
a metaphor their customers instantly recognize (record store → vinyl, bakery → flour dust,
barber → clipper lines). Present it to the user with:

- the concept in one sentence, and how it maps onto the palette/fontPairing/hero choices;
- where its **signature moment** lives: hero backdrop (`SignatureBackdrop.astro`), custom
  section (`Signature.astro` + `"signature"` in `sectionOrder`), or animation
  (`signature.ts`), per the contract in `docs/CREATIVE-CONTRACT.md`;
- what the reduced-motion/static version looks like (it must stand on its own).

Rules: at most ONE signature moment; strings via `content.signature`; tokens only; the
same test gate applies. If the user declines, skip — the dials alone are a complete design.

## Step 4 — Images

- Replace `src/assets/images/*.png` with client photos (keep filenames, or update
  `business.json` refs). Keep explicit aspect ratios reasonable (hero 4:3, gallery square).
- Regenerate the OG image from the new name + palette: `npm run generate:og`
  (replace later with a designed one if provided).

## Step 5 — Gate (all must pass)

```
npm run validate:content   # schema + contrast — fix before anything else
npm run test               # + lint + typecheck
npm run test:e2e           # smoke + axe accessibility
npx playwright test --grep @visual --update-snapshots   # rebaseline visuals for new brand
npm run test:visual        # confirm new baselines are stable
```

## Step 6 — Report

Summarize: what was filled, palette decisions (especially contrast adjustments), placeholders
still awaiting real content (photos, testimonials), and the deploy checklist from README
(Cloudflare Pages + `PUBLIC_WEB3FORMS_KEY` + `data.seo.siteUrl` matches the domain).
