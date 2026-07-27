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
npm run validate:content  # business.json: schema + WCAG palette contrast + phone/WhatsApp formats
npm run test              # validate:content + lint + typecheck
npm run test:e2e          # Playwright smoke + axe tests (builds + previews automatically)
npm run test:ltr-build    # builds the English/LTR variant, checks structure (dist/ is rebuilt to the real locale afterward)
npm run test:visual       # visual regression snapshots (local only, platform-specific)
npm run deploy:setup      # one-time: create the client's Cloudflare Pages project
npm run deploy            # test gate + build + upload dist/ to Cloudflare Pages
npm run deploy:preview    # build + upload to the "preview" branch (shareable preview URL)
npm run generate:placeholders # starter placeholder art — rename outputs to match your image fields
npm run generate:og       # regenerate OG image + favicon/icon set from business.json
npm run lhci              # Lighthouse CI against dist/ (run build first)
```

After an intentional visual change, rebaseline: `npx playwright test --grep @visual --update-snapshots`.

## Folder map

```
src/
  content/business/business.json   ← THE single source of truth
  content/business.schema.ts       ← Zod schema (edit schema first, then JSON)
  content.config.ts                ← collection wiring (file loader, id "site")
  lib/business.ts                  ← getBusiness(), getDir(), telHref(), whatsappHref(), resolveHref()
  lib/images.ts                    ← resolveImage("name.png") → src/assets/images/;
                                     no callers in the skeleton (no image fields exist yet) —
                                     used by client-authored components once a design adds them
  lib/jsonld.ts                    ← LocalBusiness / Organization / WebSite / FAQPage JSON-LD
  lib/animation/                   ← GSAP+Lenis lifecycle (index.ts) + reveal helpers;
                                     custom.ts for per-client motion; helpers.ts for
                                     marquee/parallax/counter aliveness primitives
  lib/form.ts                      ← headless contact-form logic; setupContactForms() binds
                                     any form[data-contact-form] (markup contract in docs/RECIPES.md)
  layouts/BaseLayout.astro         ← html lang/dir, brand CSS vars, SEO, fonts, JSON-LD
  components/seo/                  ← SEO/JsonLd
  components/ui/                   ← ConsentBanner only (legal machinery)
  styles/global.css                ← @theme tokens + RTL direction plumbing
  styles/custom.css                ← per-client design surface (color story, token overrides)
  pages/index.astro                ← unbuilt starter shell — replace entirely per client
  pages/404.astro                  ← not-found page (copy from content.notFound)
  pages/{accessibility-statement,privacy}.astro ← legal pages (content.legal)
  pages/{llms.txt,site.webmanifest,robots.txt}.ts ← generated endpoints
  assets/images/                   ← empty in the skeleton (+ .gitkeep); client photos land
                                     here once a design adds image fields (see the contract
                                     below); starter placeholders via npm run generate:placeholders
docs/                              ← brief.md (intake) · CLIENT-SITE-GUIDE.md (new-dev guide) ·
                                     DESIGN-DOCTRINE.md (design doctrine) · RECIPES.md (RTL/a11y
                                     patterns for nav/forms/sections) · PLAYBOOK.md (owner
                                     operating procedure) · superpowers/ (archive of shipped
                                     redesign plans — history, not instructions)
scripts/                           ← validate-content.ts, generate-placeholders.ts, generate-og.ts,
                                     check-ltr-build.ts, deploy.ts (Cloudflare Pages upload)
tests/                             ← smoke.spec.ts · a11y.spec.ts · visual.spec.ts (Playwright) +
                                     contract.ts (expectations derived from the frozen core —
                                     tests never assume a section exists)
```

Per-client artifacts that exist only in CLIENT repos, never in the template: `docs/concept.md`
(written by `/new-client`) and `docs/design-review.md` (written by `/design-review`).

## The business.json contract

- `data` = facts (NAP, hours, services, SEO). `voice` = tone + palette. `content` = every visible string, per section.
- **The shipped file is a placeholder skeleton**: every `[bracketed]` value must be replaced for a
  real client. Final sweep — must return NOTHING for a finished site:
  `rg '\[[^0-9"][^"]*\]' src/content/business/business.json`
  (matches bracketed placeholders only; a bare `rg "\["` also hits every JSON array opening).
- `content.legal.accessibility.coordinator` must contain REAL contact details before launch —
  the accessibility statement is a legal requirement in Israel (ת"י 5568).
- **No hardcoded business content in components.** New copy → add a field to `business.schema.ts`, then to `business.json`, then read it via `getBusiness()`.
- Components read content ONLY through `getBusiness()` (never import the JSON directly).
- `voice.palette` drives theme colors: BaseLayout sets `--brand-*` on `<html>`, `@theme inline` maps them to Tailwind `primary`/`secondary`/`accent`. Re-theming = editing JSON.
- Images: the skeleton ships no image fields. When a client design uses images, add fields
  schema-first (`business.schema.ts`, then `business.json`), put files in
  `src/assets/images/`, and resolve with `resolveImage()` (pattern: `docs/RECIPES.md` recipe
  5). Starter placeholders via `npm run generate:placeholders`. OG image lives in `public/`.
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
  `notFound`, `legal`) are identical in every repo. The per-client region ships NO content
  shapes beyond two optional canonical blocks: `faq` (the canonical shape for FAQPage
  JSON-LD + llms.txt — include it whenever the business has real FAQs) and `shell`
  (the template's unbuilt starter page only — delete it, schema + JSON, when building the
  real site). Everything else is authored from scratch per client, schema-first. Components
  still read ONLY via `getBusiness()`.

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
- `src/lib/animation/helpers.ts` ships three headless aliveness primitives — `marquee()`, `parallax()`, `counter()` — RTL-safe and reduced-motion-safe; call them only from `registerCustomAnimations()`. Each keeps the still-frame contract: the markup must already show the final state at rest (read the file's doc comment before use).
- The aliveness inventory is a doctrine requirement, not optional polish — see the Craft bars in `docs/DESIGN-DOCTRINE.md` (the single source for its parts).

## Conventions (one canonical way)

- Sections: `<section id="...">` matching a `content.nav` href, `scroll-mt-20`, `section-pad`, one `<h1>` per page (the hero section owns it). Patterns in `docs/RECIPES.md`.
- Client scripts: bind inside a named `setup*()` called from `document.addEventListener("astro:page-load", ...)`; pass strings from JSON via `data-*` attributes, never literals in scripts.
- TypeScript: no `any` (use `unknown` + narrowing), no non-null `!`. Zod at every runtime boundary.
- SEO: per-page overrides via BaseLayout props; JSON-LD only in `lib/jsonld.ts`.

## Deploy (Cloudflare Pages, direct upload)

- `npm run deploy:setup` once per client, then `npm run deploy` (production) / `npm run deploy:preview`.
  `scripts/deploy.ts` gates, builds, and uploads `dist/`; flags after `--`: `--project=`, `--branch=`,
  `--skip-build`, `--dry-run`.
- The Pages project name comes from `CLOUDFLARE_PAGES_PROJECT` (`.env`) or, failing that, the
  hostname of `data.seo.siteUrl` — so `siteUrl` is both the canonical origin AND the deploy target.
  It refuses to run on the `example.com` placeholder.
- **The build happens locally**, so `PUBLIC_WEB3FORMS_KEY` must be in `.env` — a key set only in the
  Cloudflare dashboard never reaches a direct upload and the contact form ships disabled.
- Deploying is outward-facing: never run `deploy*` on the user's behalf without explicit confirmation.

## Do / Don't

- DO pin dependency versions; DO keep `npm run test` + `test:e2e` green before committing.
- DO write new user-visible behavior a test in the client repo (the contract smoke suite is never edited, only added to).
- DON'T add `tailwind.config.js`, styled-components, or CSS-in-JS — tokens live in `global.css`.
- DON'T add React/islands, a CMS, or i18n libraries without an explicit request.
- DON'T write physical-direction CSS, hardcode copy/colors, or bypass `getBusiness()`/`resolveImage()`.
