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

- Rewrite EVERY string in `data`, `voice`, and `content` — including nav labels, form labels,
  FAQ, testimonials placeholders (mark clearly if awaiting real ones), and footer strings.
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
