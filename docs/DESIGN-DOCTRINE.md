# Design doctrine — constrain quality, never form

The template ships a **floor** (mechanical, testable rules) and a **toolkit**
(tokens, primitives, animation system, content pipeline, reference sections).
You — the model building a client site — design the page 0→100 on top of them.
Nothing structural is prescribed; everything structural is available. The test
gate, not a list of allowed layouts, decides what ships.

## The floor (non-negotiable, unchanged)

- RTL: logical properties/utilities only; `--dir-factor` / `--angle-brand` /
  `--origin-inline-start` / `--bg-pos-inline-start` for what doesn't auto-flip;
  `<bdi>` for mixed runs; `.force-ltr` for phones/prices/emails; no
  letter-spacing on Hebrew.
- Copy lives in `business.json`, read via `getBusiness()` — never hardcoded.
  Images via `resolveImage()`; hrefs via `resolveHref()`.
- Colors are tokens (`--color-primary|secondary|accent|surface|…`); tints via
  `color-mix()`. Text sits only on validated contrast pairs (`text-primary` on
  `bg-surface`; on dark surfaces use `text-surface`). New color-as-text pair →
  add it to `scripts/validate-content.ts` first.
- Reduced motion = static page. Design the still frame first. All motion lives
  inside the matchMedia context in `src/lib/animation/index.ts`; entrances via
  `data-reveal`; animate transforms/opacity only.
- Decorative elements: `aria-hidden="true"` + `pointer-events-none`.
- No new dependencies. TypeScript strict, no `any`, Zod at runtime boundaries.
- The gate: `npm run test` + `npm run test:e2e` + `npm run test:ltr-build`
  green; Lighthouse budgets hold (LCP ≤ 2.5s, TBT ≤ 200ms, CLS ≤ 0.1).

## The page contract (what every site must keep)

- Exactly one `h1`.
- Every `content.nav` link of the form `#id` resolves to a real element id;
  sections use `<section id="…">` + `scroll-mt-20` + the `section-pad` utility.
- A `body > footer` containing links to the two legal pages
  (accessibility statement is a legal requirement in Israel, ת"י 5568).
- The frozen `content` core stays intact: `nav`, `ui`, `consent`, `notFound`,
  `legal`. Hebrew sites keep a bidi test line (Hebrew + Latin + ₪) in visible
  body copy.
- A clear contact path (form, WhatsApp, or phone) reachable from the nav.
- `lib/jsonld.ts` reads `content.faq` for FAQPage JSON-LD — if your design has
  no FAQ, keep the field with real Q&A anyway (it still feeds AEO) or adapt
  `faqJsonLd` and the smoke JSON-LD count together, in the same commit.
- The contract-driven smoke suite passes with ZERO edits. New user-visible
  behavior gets **added** tests in the client repo; never weaken the suite.

## The toolkit

- **Tokens** (`global.css`): brand colors from `voice.palette`; shape/rhythm
  via `--shape-radius-card`, `--shape-radius-button`, `--section-py` —
  override per client in `custom.css`, never literal radii or `py-*`.
- **Fonts**: `design.fontPairing` — six self-hosted Hebrew-capable pairings
  (the one design decision that stays data; fonts register at build time).
  Components only use `font-display` / `font-sans`.
- **Reference sections** (`src/components/sections/`): tested, RTL-correct
  worked examples. Use them as-is, pass their variant props
  (`Hero variant`, `Services layout`, `Gallery layout`), gut and redesign
  them, or ignore them and build fresh — per client, per section. They are
  examples of the rules, not the product.
- **Composition**: `src/pages/index.astro` is yours. The shipped default
  composes the references so a fresh clone builds green.
- **UI primitives**: `Container`, `SectionHeading`, `Button`.
- **Animation**: `data-reveal` presets for entrances; bespoke GSAP/ScrollTrigger
  registered from a `setup*()` you add inside the matchMedia context in
  `src/lib/animation/index.ts` (tweens created synchronously revert on swap;
  return cleanup only for listeners/observers you own). Lenis + ScrollTrigger
  are pre-synced; importing gsap adds ~0 bytes.
- **Schema**: `data` + `voice` are frozen. The per-client region of `content`
  is reshaped schema-first: `business.schema.ts` → `business.json` →
  components via `getBusiness()`.

## The design process (before any code)

Write the concept in four lines — if you can't, it isn't one concept yet:

1. **Metaphor** — one thing from the client's world their customers instantly
   recognize (vinyl / steam / thread / clipper lines).
2. **Color story** — which sections go light / tinted / dark; where the accent
   burns brightest (usually the CTA). Rhythm, not stripes.
3. **Composition** — the actual page: which sections exist, what each one *is*,
   in what order, and why that order serves this business.
4. **Motion identity** — the ONE characteristic movement reused everywhere
   motion appears, including the `data-reveal` choices.

Plus the reduced-motion still frame: the page must look complete without any
motion. ONE concept, expressed everywhere it helps — incoherence, not
quantity, is what reads as noise.

## The promote loop

When a client-repo idea proves broadly useful, generalize it (tokens, props,
`data-reveal` preset, or a new reference section) and PR it into the template.
Client repos stay free to be weird; the template absorbs only the winners.
Never copy client-specific code between client repos.
