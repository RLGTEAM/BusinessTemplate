# AGENTS.md

Static Astro template for small-business sites. Cloned once per client, then designed 0→100 per client on a fixed quality floor — see `docs/DESIGN-DOCTRINE.md`. Facts, voice, and copy live in `src/content/business/business.json`. Hebrew/RTL-first; flips to LTR via `locale`.

## Stack

Astro 7 (static) · TypeScript strict · Tailwind CSS 4 (CSS-first, no `tailwind.config.js`) · GSAP + ScrollTrigger + Lenis · Zod-validated content collection · Biome · Playwright · Lighthouse CI. No React — sections are pure `.astro`. Only add a framework island if a section is genuinely interactive (then: one isolated island, `client:visible`).

## Commands

```
npm run dev               # dev server on :4321
npm run build             # static build to dist/ (fails on invalid business.json)
npm run preview           # serve dist/
npm run lint              # biome check .
npm run format            # biome check --write .
npm run typecheck         # astro check
npm run validate:content  # standalone business.json schema check
npm run test              # validate:content + lint + typecheck
npm run test:e2e          # Playwright smoke + axe tests (builds + previews automatically)
npm run test:ltr-build    # builds the English/LTR variant, checks structure (leaves it in dist/)
npm run test:visual       # visual regression snapshots (local only, platform-specific)
npm run generate:og       # regenerate public/og-default.png from business.json
npm run lhci              # Lighthouse CI against dist/ (run build first)
```

After an intentional visual change, rebaseline: `npx playwright test --grep @visual --update-snapshots`.

## Folder map

```
src/
  content/business/business.json   ← THE single source of truth
  content/business.schema.ts       ← Zod schema (edit schema first, then JSON)
  content.config.ts                ← collection wiring (file loader, id "site")
  lib/business.ts                  ← getBusiness(), telHref(), whatsappHref(), resolveHref()
  lib/images.ts                    ← resolveImage("name.png") → src/assets/images/
  lib/jsonld.ts                    ← LocalBusiness / Organization / WebSite / FAQPage JSON-LD
  lib/animation/                   ← GSAP+Lenis lifecycle (index.ts) + reveal helpers
  layouts/BaseLayout.astro         ← html lang/dir, brand CSS vars, SEO, fonts, JSON-LD
  components/sections/             ← reference library: tested, RTL-correct worked examples
                                     (use, gut, or ignore per client)
  components/seo/  components/ui/  ← SEO/JsonLd · Container/SectionHeading/Button
  styles/global.css                ← @theme tokens + RTL direction plumbing
  styles/custom.css                ← per-client design surface (color story, token overrides)
  pages/index.astro                ← per-client page composition (ships a default that passes the gate)
  pages/404.astro                  ← not-found page (copy from content.notFound)
  pages/{accessibility-statement,privacy}.astro ← legal pages (content.legal)
  pages/{llms.txt,site.webmanifest,robots.txt}.ts ← generated endpoints
  assets/images/                   ← images referenced by filename in business.json
docs/                              ← brief.md (intake) · CLIENT-SITE-GUIDE.md (new-dev guide) ·
                                     DESIGN-DOCTRINE.md (design doctrine) · examples/ (demo salon)
scripts/                           ← validate-content.ts, generate-placeholders.ts, generate-og.ts,
                                     check-ltr-build.ts
tests/                             ← smoke.spec.ts · a11y.spec.ts · visual.spec.ts (Playwright)
```

## The business.json contract

- `data` = facts (NAP, hours, services, SEO). `voice` = tone + palette. `content` = every visible string, per section.
- **The shipped file is a placeholder skeleton**: every `[bracketed]` value must be replaced for a
  real client. Final sweep: `rg "\[" src/content/business/business.json` must return nothing
  except the bidi test line. A fully-filled reference lives at `docs/examples/demo-salon.business.json`.
- `content.legal.accessibility.coordinator` must contain REAL contact details before launch —
  the accessibility statement is a legal requirement in Israel (ת"י 5568).
- **No hardcoded business content in components.** New copy → add a field to `business.schema.ts`, then to `business.json`, then read it via `getBusiness()`.
- Components read content ONLY through `getBusiness()` (never import the JSON directly).
- `voice.palette` drives theme colors: BaseLayout sets `--brand-*` on `<html>`, `@theme inline` maps them to Tailwind `primary`/`secondary`/`accent`. Re-theming = editing JSON.
- Images: `business.json` references filenames; files live in `src/assets/images/`; resolve with `resolveImage()`. OG image lives in `public/`.
- Link fields may use the sentinel `"whatsapp"` — always pass hrefs through `resolveHref()`.
- Schema failures fail the build. Run `npm run validate:content` after editing.
- **Palette contract**: `validate:content` enforces WCAG AA (≥ 4.5:1) on 9 pairs computed against
  the REAL palette, neutrals included — `ink`↔`surface`, `ink`↔`surface-alt`, `ink-muted`↔`surface`,
  `ink-muted`↔`surface-alt`, `primary`↔`surface`, `primary`↔`surface-alt`, `secondary`↔`surface`,
  `secondary`↔`surface-alt`, `accent`↔`secondary`. Neutrals (`surface`/`surfaceAlt`/`ink`/`inkMuted`/
  `line`) come from `voice.palette` with light-theme defaults; dark sites are first-class, not a
  workaround. `text-primary` only on `bg-surface`; text on `bg-accent` is always `text-secondary`;
  never use `accent` as text on light backgrounds. New color-as-text usage → add the pair to
  `scripts/validate-content.ts` first.
- **Model-first design** — the page is designed per client under `docs/DESIGN-DOCTRINE.md`:
  composition, section design, shape/rhythm tokens, color story are all code decisions. The
  only design data in `business.json` is `design.fontPairing` (fifteen self-hosted Hebrew-capable
  pairings mapped in astro.config.mjs; components only use `font-display`/`font-sans`).
- **Content split** — `data` + `voice` + the `content` frozen core (`nav`, `ui`, `consent`,
  `notFound`, `legal`) are identical in every repo; the rest of `content` is reshaped per
  client, schema-first. Components still read ONLY via `getBusiness()`.

## RTL rules (non-negotiable)

- Logical properties/utilities ONLY: `ms-* me-* ps-* pe-* start-* end-* text-start inset-inline-*`. Never `ml/mr/pl/pr/left-/right-/text-left/text-right`.
- Properties that do NOT auto-flip use the tokens in `global.css`: multiply x-offsets (shadows, translateX) by `var(--dir-factor)`; gradients use `var(--angle-brand)`; transform-origin uses `var(--origin-inline-start)`; background-position uses `var(--bg-pos-inline-start)`. GSAP x-slides go through `reveal.ts`, which mirrors automatically.
- Wrap mixed Hebrew/Latin/number runs in `<bdi>`; phone numbers, prices, emails, times get `class="force-ltr"`.
- Never letter-spacing/tracking-* on Hebrew text (guarded in global.css — don't fight it).

## Animation rules

- One way to animate content in: `data-reveal` / `data-reveal="slide-start|slide-end|scale|blur|clip"` / `data-reveal-group` (staggers children). Defined in `src/lib/animation/reveal.ts`. Per-element tuning via `data-reveal-duration` / `-delay` / `-distance` / `-start` (and `-stagger` on groups).
- Bespoke motion goes in `registerCustomAnimations()` in `src/lib/animation/custom.ts` — the entry point called inside the reduced-motion-guarded matchMedia context. Ships as a no-op in the template.
- Everything lives inside `gsap.matchMedia()` guarded by `prefers-reduced-motion` — reduced motion = static page, no exceptions.
- Lifecycle is wired once in BaseLayout: init on `astro:page-load`, full teardown on `astro:before-swap`. Never create GSAP/Lenis instances elsewhere.
- Animate transforms/opacity only, with TWO sanctioned exceptions: the `blur` preset (animates `filter`) and the `clip` preset (animates `clip-path`, dir-aware). Content must be visible without JS.

## Conventions (one canonical way)

- Sections: one `.astro` file in `components/sections/`, `<section id="...">` matching a `content.nav` href, `scroll-mt-20`, `section-pad`, heading via `<SectionHeading>`, one `<h1>` per page (Hero owns it in the reference composition).
- Client scripts: bind inside a named `setup*()` called from `document.addEventListener("astro:page-load", ...)`; pass strings from JSON via `data-*` attributes, never literals in scripts.
- TypeScript: no `any` (use `unknown` + narrowing), no non-null `!`. Zod at every runtime boundary.
- SEO: per-page overrides via BaseLayout props; JSON-LD only in `lib/jsonld.ts`.

## Do / Don't

- DO pin dependency versions; DO keep `npm run test` + `test:e2e` green before committing.
- DO write new user-visible behavior a test in the client repo (the contract smoke suite is never edited, only added to).
- DON'T add `tailwind.config.js`, styled-components, or CSS-in-JS — tokens live in `global.css`.
- DON'T add React/islands, a CMS, or i18n libraries without an explicit request.
- DON'T write physical-direction CSS, hardcode copy/colors, or bypass `getBusiness()`/`resolveImage()`.
