# Template changelog

The version lives in `TEMPLATE_VERSION` (calver, bumped whenever a change is
worth propagating to client repos). Client repos pull template-owned files
with `npm run sync:template`, which compares versions and stages a review
branch — read the entry for every version between yours and the template's
before merging.

Entry tags:

- **[safe-to-sync]** — template-owned files only; a normal diff review is enough.
- **[review]** — changes a contract (schema shape, test expectations, markup
  contract) that a client site may have built against; read the notes and
  check the named surfaces before merging.

## 2026.08.14

First versioned release. Includes the full audit-hardening pass:

- **[review]** Hours rendering changed shape — `docs/RECIPES.md` recipe 6
  (footer) now maps `entry.ranges` and renders an explicit closed state. A
  client footer copied from the old recipe (`entry.open`/`entry.close`) will
  fail `astro check` until it is updated.
- **[safe-to-sync]** Guards proven by tests rather than trusted:
  `tests/schema.spec.ts` (unknown keys, duplicate weekdays, zero-length
  ranges, impossible dates, wa.me/gtag formats) and `tests/consent.spec.ts`
  (consent is actually withdrawable). `validate:content` now also walks the
  schema and fails if any object is non-strict.
- **[safe-to-sync]** Fixes found by adversarial review of this same pass:
  the reopened consent banner had dead Accept/Decline buttons; a production
  deploy after a preview deploy could re-upload the preview's
  `X-Robots-Tag: noindex` and de-index the live site (`--skip-build` path);
  `npm run report` compared a top-15 current window against a top-1000
  previous one, making every delta wrong; preflight now rejects the skeleton
  audit/statement dates and catches a missing FAQPage emission.

- **[safe-to-sync]** `scripts/preflight.ts` launch gate (+ `npm run preflight`,
  wired into production deploys); validator additions (star codes, hours
  ranges, real-date checks); generator overwrite guards; OG generation moved
  to headless Chromium (correct Hebrew rendering).
- **[safe-to-sync]** Runtime fixes: capture-phase anchor scrolling with
  scroll-margin + focus handling (skip link works under Lenis); consent
  banner single-load + canonical gtag/fbq stubs; form status/label/timeout
  fixes; conversion tracking (`src/lib/track.ts` — tel:/wa.me/lead events).
- **[review]** `business.schema.ts` is now `.strict()` everywhere — a client
  JSON with a stray key that was previously ignored will now FAIL the build
  (that key was dead weight; delete it or add it to the schema).
- **[review]** Hours shape changed: `{open, close}` → `ranges: [{open,
  close}]` with explicit closed days, plus optional `specialHours`. Client
  components that render hours must switch to `h.ranges`.
- **[review]** JSON-LD: single business node (Organization node removed),
  `@type` from new `data.schemaType`; new fields `data.local.*`,
  `data.reviews`, `data.companyId`, `data.seo.logo`, optional address +
  `city`. Smoke test JSON-LD assertion updated accordingly.
- **[review]** Legal frozen core extended: statement gains known
  limitations, physical accessibility, coordinator role, audit date +
  labels; privacy gains statement date; optional `legal.terms` shape.
  Client `business.json` files need the new fields (copy from the skeleton
  and fill).
