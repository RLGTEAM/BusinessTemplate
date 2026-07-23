# Model-first inversion — design

**Date:** 2026-07-23
**Status:** Approved (design); implementation not yet planned

## Problem

The template constrains two different things with the same severity:

1. **Mechanical quality rules** — RTL logical properties, WCAG contrast pairs,
   reduced-motion, tokens-not-hex, content through `getBusiness()`, the test
   gate, Lighthouse budgets. These define the quality floor and do not limit
   creativity.
2. **Structural prescriptions** — the fixed 10-section inventory, layout enums
   (`hero`, `servicesLayout`, `galleryLayout`, `shape`, `density`,
   `sectionOrder`), "never fork a section," and custom code confined to four
   sanctioned files (`components/custom/` + `custom.css`).

The second category caps the LLM at *decorating* pages rather than *designing*
them. Every client site is the same skeleton in a different coat; the variant
dials, built as an anti-sameness system, are also a sameness ceiling. The
observed pains: sites feel samey, section internals are locked, page
composition is locked, and the product philosophy should be model-first.

## Decision

**Invert the template: constrain quality, never form.** The repo ships a
*floor* (mechanical, testable rules) and a *toolkit* (tokens, UI primitives,
animation system, content pipeline, reference sections), and the LLM designs
each client site 0→100 on top of it. Structural prescriptions become defaults
and references; the test gate replaces the enums as the anti-garbage
mechanism.

Choices made during brainstorming:

- **Existing sections → reference library** (not deleted, not a parallel
  fast-path product). Tested, RTL-correct worked examples the model may use
  as-is, gut and redesign, or ignore — per client, per section.
- **Schema split**: `data` (NAP, hours, services, SEO) and `voice` stay a
  fixed, strictly-validated schema — they feed JSON-LD, llms.txt, legal pages,
  and the OG image. The `content` block becomes per-client: the model reshapes
  the content portion of `business.schema.ts` to match the page it designed
  (schema-first, still Zod-validated). "No hardcoded copy" and the
  JSON-edit-only client feedback loop both survive.
- **Design approved as-is** — the enum dials are removed, not kept as optional
  defaults.

## What stays — the mechanical floor (untouched)

- Stack: Astro static, Tailwind 4 CSS-first tokens (no `tailwind.config.js`),
  GSAP + ScrollTrigger + Lenis with the BaseLayout lifecycle, no framework
  islands by default.
- RTL rules (logical properties only, `--dir-factor` and friends), WCAG
  contrast validation in `validate-content`, reduced-motion = static page,
  animate transforms/opacity only, `<bdi>` / `force-ltr` conventions.
- Content only through `getBusiness()` / `resolveImage()` / `resolveHref()`.
- The SEO/AEO machine: JSON-LD (`lib/jsonld.ts`), sitemap, robots, llms.txt,
  manifest + icons, legal pages, OG generation.
- The full test gate: `validate:content` + Biome + `astro check` + Playwright
  smoke/axe + LTR build check + Lighthouse budgets (LCP ≤ 2.5s, TBT ≤ 200ms,
  CLS ≤ 0.1).

## What inverts

- **`components/sections/` becomes a reference library.** Documented as
  worked examples. `pages/index.astro` is composed per client by the model,
  no longer rendered from `design.sectionOrder`. The template still ships a
  working default `index.astro` that composes the reference sections in a
  sensible order — a fresh clone builds and passes the gate; the model
  rewrites the composition per client.
- **The `design` enum block dissolves.** `fontPairing` survives as a curated
  menu (self-hosted + Hebrew-capable is a real mechanical constraint);
  `locale` survives. `hero`, `shape`, `density`, `servicesLayout`,
  `galleryLayout`, `sectionOrder` are removed as enums. The `section-pad` /
  `rounded-card` utilities remain, with per-client values set in tokens.
- **The `custom/` sandbox disappears as a concept.** When everything is
  designable, a sanctioned sandbox is meaningless. `custom.css` remains as
  the conventional home for the per-client color story.
- **`content` schema is per-client and model-authored** (see schema split
  above). Workflow stays schema-first: edit schema → edit JSON → components
  read via `getBusiness()`.

## The doctrine — docs are the product

Replace `docs/CREATIVE-CONTRACT.md` with a design doctrine (new doc), and
rewrite `AGENTS.md` and the `/new-client` skill accordingly:

- Required design process **before any code**: written concept (metaphor from
  the client's world) → color story → page composition → motion identity.
- What distinguishes a designed page from a filled template.
- "Design the reduced-motion still frame first."
- The promote loop: client-repo ideas that prove broadly useful get
  generalized and absorbed into the template's reference library via PR.
- "ONE concept, many expressions" survives as craft guidance, not a fence.
- `/new-client` demands and reviews the written concept before building.

## Tests must generalize (the real engineering)

`tests/smoke.spec.ts` currently assumes the fixed section inventory. It must
become contract-driven — expectations derived from `business.json`:

- Every `content.nav` link resolves to a real element id on the page.
- Exactly one `h1`.
- Phone / WhatsApp hrefs correct (`telHref` / `whatsappHref`).
- Contact form present and wired if configured.
- axe clean; LTR build structurally valid.

No test may hardcode the existence of a specific section.

## Accepted trade-offs

- Output quality rides on model + doctrine instead of enums. A weak run can
  produce a worse site than the dial system could; the gate catches *broken*,
  not *bland*.
- Client repos diverge structurally; template updates propagate even less
  than today (already mostly true — clones are frozen at known-good versions).
- Per-client build cost rises. That is the price of 0→100.

## Out of scope

- Adding frameworks/islands, CMS, or i18n libraries (unchanged policy).
- Changing deploy flow, CI structure, or the agency/client repo model.
- Rewriting the reference sections themselves.
