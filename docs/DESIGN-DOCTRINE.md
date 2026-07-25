# Design doctrine — constrain quality, never form

The template ships a **floor** (mechanical, testable rules) and a **toolkit**
(tokens, animation system, content pipeline, recipes). You — the model
building a client site — design the page 0→100 on top of them.
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
  `color-mix()`. Text sits only on validated contrast pairs, computed against
  the REAL palette values (9 pairs built into `scripts/validate-content.ts`:
  ink/ink-muted × surface/surface-alt, primary/secondary × surface/surface-alt,
  accent↔secondary) — `text-primary` on `bg-surface`; on dark surfaces use
  `text-surface`. New color-as-text pair → add it to
  `scripts/validate-content.ts` first.
- Reduced motion = static page. Design the still frame first. Motion lives
  inside the matchMedia context (`src/lib/animation/index.ts`; bespoke motion
  via `registerCustomAnimations` in `src/lib/animation/custom.ts`); entrances
  via `data-reveal`; animate transforms/opacity only — with exactly two
  sanctioned exceptions: the `blur` preset (filter) and the `clip` preset
  (dir-aware clip-path).
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
- `content.faq` is the canonical OPTIONAL shape feeding FAQPage JSON-LD +
  llms.txt — include it (real Q&A) whenever the business has FAQs; without
  it the site emits 3 JSON-LD blocks and that is fine.
- The contract-driven smoke suite passes with ZERO edits. New user-visible
  behavior gets **added** tests in the client repo; never weaken the suite.

## Divergence (hard rules)

A site that passes the floor and the page contract can still be the
reference template with different words on it. These five, plus the
Craft-bar concept requirements (the nav concept and the choreography plan —
see Craft bars 2 and 3, below), are binding for every client build and are
enforced at the concept stage in `/new-client` Step 1:

1. A bespoke hero treatment — a hero designed for this client, not a generic centered-headline default.
2. At least one fully bespoke section.
3. A signature motion implemented in `registerCustomAnimations()`
   (`src/lib/animation/custom.ts`).
4. A non-default color story — no all-default-white page unless
   `docs/concept.md` explicitly argues light-minimal serves THIS client.
5. The page must not contain shell markup or `content.shell`.

The design-review skill (`.claude/skills/design-review/SKILL.md`) is the
single source for how the built result is judged against these rules and the
rest of the rubric — this doc doesn't restate the scoring. A site that fails
that review isn't finished, even with a green test gate.

## Craft bars (what top-tier means)

Passing the floor, the page contract, and divergence proves the site is legal
and different — not that it's good. These four bars are where real
`/new-client` runs have kept falling short: a weak navbar, a page that feels
static, a desktop-first layout squeezed onto a phone, an unmistakably
AI-generated look, motion bolted on as an afterthought. Design to these from
the first pass; they are not a post-review patch list.

1. **Mobile-first — the phone is the primary canvas.** Compose at 390px
   FIRST; desktop is the adaptation, never the reverse. The primary CTA stays
   thumb-reachable; a sticky mobile contact bar (tel/WhatsApp — pattern in
   RECIPES) is the strong default for service businesses. The type scale must
   hold at 390 — no truncation, no horizontal overflow. No information exists
   only on hover. Full-height heroes use `100dvh` plus safe-area-insets.
2. **The header is a designed component, not chrome.** Three requirements,
   all mandatory: scroll-aware behavior — tint, shrink, blur, or a
   concept-fitting response past a scroll threshold (pattern in RECIPES,
   wired via `registerCustomAnimations`); active-section indication —
   `aria-current` plus a visible state, not a color change alone; a DESIGNED
   mobile drawer — staggered entrance, full styling. The RECIPES a11y
   pattern (expand/collapse, Escape, focus return) is the accessibility
   floor here, not the design.
3. **Aliveness — one identity, MANY expressions.** One motion IDENTITY —
   consistent easing, direction, character — expressed across a REQUIRED
   five-part inventory, never as a single repeated trick: (a) hero entrance
   choreography, a sequenced timeline, never one fade; (b) at least two
   scroll-driven moments — parallax, scrub, pin, or counter (helpers in
   `src/lib/animation/helpers.ts`); (c) micro-interactions on EVERY
   interactive element — hover/focus/press with motion on buttons, links,
   cards; (d) at least one continuous ambient motion — marquee, drift, slow
   rotation; (e) varied `data-reveal` presets tuned per section, never the
   same preset everywhere. All five stay inside the reduced-motion guard —
   the still frame remains complete without any of them.
4. **Anti-AI tells.** Named list to avoid — the judge checks for these:
   uniform same-radius card grids of three; emoji as icons (inline SVG
   only); center-aligning everything; generic gradient blobs or
   purple-indigo defaults; a hero that's headline + two buttons + a
   stock-photo overlay; identical section rhythm down the page (same
   padding, same alternation); Tailwind-default shadows everywhere;
   decorative English labels sprinkled on a Hebrew site. Prescribe instead:
   intentional asymmetry; at least one overlap or broken-grid moment;
   display-to-body type-scale contrast of 3x or more; bespoke inline-SVG
   iconography/motifs derived from the concept.

## The toolkit

- **Tokens** (`global.css`): brand colors from `voice.palette`, neutrals
  included (`surface`, `surfaceAlt`, `ink`, `inkMuted`, `line` — defaults are
  the reference light theme; a dark site is a first-class palette, not a
  hack). Shadows derive from `ink`. Shape/rhythm via `--shape-radius-card`,
  `--shape-radius-button`, `--section-py` — override per client in
  `custom.css`, never literal radii or `py-*`.
- **Fonts**: `design.fontPairing` — fifteen self-hosted Hebrew-capable
  pairings, each with its own weight set (the one design decision that stays
  data; fonts register at build time). `handmade` (Amatic SC) is
  display-only — headings, never body copy, and never long headings.
  Components only use `font-display` / `font-sans`.
- **Recipes** (`docs/RECIPES.md`) — RTL/a11y-correct patterns distilled from
  experience; consult before building nav, forms, sections.
- **Composition**: `src/pages/index.astro` ships as an unbuilt contract
  shell — replace it entirely; delete `content.shell`.
- **Animation**: `data-reveal` presets for entrances (`slide-start`,
  `slide-end`, `scale`, `blur`, `clip`), each tunable per-element via
  `data-reveal-duration` / `-delay` / `-distance` / `-start` (and `-stagger`
  on `data-reveal-group`). `blur` (animates `filter`) and `clip` (animates
  `clipPath`, dir-aware) are the TWO sanctioned exceptions to
  transforms/opacity-only — everything else stays on transforms/opacity.
  Bespoke GSAP/ScrollTrigger goes in `registerCustomAnimations()` in
  `src/lib/animation/custom.ts` — the entry point, called inside the
  reduced-motion-guarded matchMedia context (tweens created synchronously
  revert on swap; return cleanup only for listeners/observers you own). Lenis
  + ScrollTrigger are pre-synced; importing gsap adds ~0 bytes. Three
  aliveness primitives ship in `src/lib/animation/helpers.ts` — `marquee()`,
  `parallax()`, `counter()` — headless (no markup opinions), RTL-safe (mind
  logical direction), called only from `registerCustomAnimations()`. Each
  keeps the still-frame contract: the server-rendered markup must already
  show the final state (the complete marquee content before duplication, the
  formatted target number before `counter()` re-animates it) so reduced-motion
  and no-JS visitors see it correctly at rest.
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
4. **Motion identity** — one recognizable identity (easing, direction,
   character), expressed across the required aliveness inventory (see
   "Aliveness" in Craft bars, above) rather than one movement copy-pasted
   everywhere — including which `data-reveal` presets you choose per section.

Plus the reduced-motion still frame: the page must look complete without any
motion. ONE concept, expressed everywhere it helps — incoherence, not
quantity, is what reads as noise.

## The promote loop

When a client-repo idea proves broadly useful, generalize it (tokens, a
`data-reveal` preset, or a new recipe in `docs/RECIPES.md`) and PR it into
the template.
Client repos stay free to be weird; the template absorbs only the winners.
Never copy client-specific code between client repos.
