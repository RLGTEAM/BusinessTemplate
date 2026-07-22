# AGENTS.md

Static Astro template for small-business sites. Cloned once per client, then filled by editing **one file**: `src/content/business/business.json`. Hebrew/RTL-first; flips to LTR via `locale`.

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
  lib/jsonld.ts                    ← LocalBusiness / Organization / FAQPage JSON-LD
  lib/animation/                   ← GSAP+Lenis lifecycle (index.ts) + reveal helpers
  layouts/BaseLayout.astro         ← html lang/dir, brand CSS vars, SEO, fonts, JSON-LD
  components/sections/             ← Header, Hero, Services, About, Testimonials,
                                     Gallery, FAQ, CTA, ContactForm, Footer
  components/seo/  components/ui/  ← SEO/JsonLd · Container/SectionHeading/Button
  styles/global.css                ← @theme tokens + RTL direction plumbing
  pages/index.astro                ← composes all sections
  assets/images/                   ← images referenced by filename in business.json
scripts/                           ← validate-content.ts, generate-placeholders.ts
tests/smoke.spec.ts                ← Playwright smoke suite
```

## The business.json contract

- `data` = facts (NAP, hours, services, SEO). `voice` = tone + palette. `content` = every visible string, per section.
- **No hardcoded business content in components.** New copy → add a field to `business.schema.ts`, then to `business.json`, then read it via `getBusiness()`.
- Components read content ONLY through `getBusiness()` (never import the JSON directly).
- `voice.palette` drives theme colors: BaseLayout sets `--brand-*` on `<html>`, `@theme inline` maps them to Tailwind `primary`/`secondary`/`accent`. Re-theming = editing JSON.
- Images: `business.json` references filenames; files live in `src/assets/images/`; resolve with `resolveImage()`. OG image lives in `public/`.
- Link fields may use the sentinel `"whatsapp"` — always pass hrefs through `resolveHref()`.
- Schema failures fail the build. Run `npm run validate:content` after editing.
- **Palette contract**: `validate:content` enforces WCAG AA (≥ 4.5:1) on the pairs the template
  actually uses — primary↔surface, secondary↔surface, secondary↔surface-alt, accent↔secondary.
  Therefore: `text-primary` only on `bg-surface`; text on `bg-accent` is always `text-secondary`;
  never use `accent` as text on light backgrounds. New color-as-text usage → add the pair to
  `scripts/validate-content.ts` first.
- **Design variants (`design` block)** — the anti-sameness system; every client site must use a
  DISTINCT combination:
  - `fontPairing`: classic (Assistant/Heebo) · modern (Rubik/Assistant) ·
    elegant (Frank Ruhl Libre/Heebo) · warm (Alef/Rubik) · bold (Karantina/Heebo, condensed
    display) · editorial (David Libre/Assistant, serif display). Mapped in astro.config.mjs;
    components only ever use `font-display`/`font-sans`.
  - `hero`: split · centered · full-bleed (variants live inside Hero.astro).
  - `shape`: rounded · sharp · pill — sets `data-shape` on `<html>`; use `rounded-card` /
    `rounded-button` utilities, never a literal radius.
  - `density`: airy · regular · compact — sets `data-density`; sections use the `section-pad`
    utility, never a literal `py-*` on a `<section>`.
  - `servicesLayout`: cards · list · panels (inside Services.astro).
  - `galleryLayout`: grid · masonry · featured (inside Gallery.astro).
  - `sectionOrder`: permutation of the 7 middle sections; index.astro renders from it. Keep
    `content.nav` link order consistent with it.
  - Adding a variant = schema enum → tokens/markup → this list. Never fork a section per client.

## RTL rules (non-negotiable)

- Logical properties/utilities ONLY: `ms-* me-* ps-* pe-* start-* end-* text-start inset-inline-*`. Never `ml/mr/pl/pr/left-/right-/text-left/text-right`.
- Properties that do NOT auto-flip use the tokens in `global.css`: multiply x-offsets (shadows, translateX) by `var(--dir-factor)`; gradients use `var(--angle-brand)`; transform-origin uses `var(--origin-inline-start)`; background-position uses `var(--bg-pos-inline-start)`. GSAP x-slides go through `reveal.ts`, which mirrors automatically.
- Wrap mixed Hebrew/Latin/number runs in `<bdi>`; phone numbers, prices, emails, times get `class="force-ltr"`.
- Never letter-spacing/tracking-* on Hebrew text (guarded in global.css — don't fight it).

## Animation rules

- One way to animate content in: `data-reveal` / `data-reveal="slide-start|slide-end|scale"` / `data-reveal-group` (staggers children). Defined in `src/lib/animation/reveal.ts`.
- Everything lives inside `gsap.matchMedia()` guarded by `prefers-reduced-motion` — reduced motion = static page, no exceptions.
- Lifecycle is wired once in BaseLayout: init on `astro:page-load`, full teardown on `astro:before-swap`. Never create GSAP/Lenis instances elsewhere.
- Animate transforms/opacity only. Content must be visible without JS.

## Conventions (one canonical way)

- Sections: one `.astro` file in `components/sections/`, `<section id="...">` matching a `content.nav` href, `scroll-mt-20`, heading via `<SectionHeading>`, exactly one `<h1>` per page (Hero owns it).
- Client scripts: bind inside a named `setup*()` called from `document.addEventListener("astro:page-load", ...)`; pass strings from JSON via `data-*` attributes, never literals in scripts.
- TypeScript: no `any` (use `unknown` + narrowing), no non-null `!`. Zod at every runtime boundary.
- SEO: per-page overrides via BaseLayout props; JSON-LD only in `lib/jsonld.ts`.

## Do / Don't

- DO pin dependency versions; DO keep `npm run test` + `test:e2e` green before committing.
- DO update `tests/smoke.spec.ts` when adding user-visible behavior.
- DON'T add `tailwind.config.js`, styled-components, or CSS-in-JS — tokens live in `global.css`.
- DON'T add React/islands, a CMS, or i18n libraries without an explicit request.
- DON'T write physical-direction CSS, hardcode copy/colors, or bypass `getBusiness()`/`resolveImage()`.
