# Building a client landing page from this template

A practical guide for a developer picking up this repo for the first time to ship a
landing page for a real customer. `business.json` holds the facts, voice, and copy;
the page itself — composition, section design, color story, motion — is a design
decision made in code, on the quality floor set out in
[docs/DESIGN-DOCTRINE.md](./DESIGN-DOCTRINE.md).

> Working with Claude Code? Run the `/new-client` skill — it walks the whole flow
> below interactively (brief → business.json → theme → validation → tests).

## The 30-minute flow

1. **Clone + install**
   ```
   git clone <this repo> client-name && cd client-name && npm install
   ```
2. **Fill `src/content/business/business.json`** — the single source of truth.
   Every `[bracketed]` placeholder must be replaced. Three blocks:
   - `data` — facts: name, NAP, hours, services, prices, SEO, socials.
   - `voice` — tone, keywords, `palette` (brand hexes + neutrals — `surface`,
     `surfaceAlt`, `ink`, `inkMuted`, `line` — + mood). Neutrals default to a
     light theme but are fully configurable; a dark or deep-tinted site is
     just as valid a palette choice.
   - `content` — every visible string, section by section.

   A fully-filled reference lives at `docs/examples/demo-salon.business.json`.
3. **Pick a font pairing** (`design.fontPairing` in `business.json`) and set the
   section variant props in `src/pages/index.astro` (see "Making it look unique" below).
4. **Swap images**: drop the client's photos into `src/assets/images/` keeping the
   same filenames (or update the filenames in `business.json`). Until you have real
   photos: `npx tsx scripts/generate-placeholders.ts`.
5. **Regenerate the OG image**: `npm run generate:og`.
6. **Validate + test** (do this early and often — schema failures fail the build):
   ```
   npm run validate:content   # fastest feedback on business.json
   npm run test               # schema + lint + typecheck
   npm run test:e2e           # smoke + axe + visual (builds itself, port 4322)
   ```
7. **Final sweep before launch**:
   - `rg "\[" src/content/business/business.json` → only the bidi test line may match.
   - `content.legal.accessibility.coordinator` has **real** contact details —
     the accessibility statement is a legal requirement in Israel (ת"י 5568).
   - `data.seo.siteUrl` points at the real domain (it feeds the sitemap + JSON-LD).

## Making it look unique (design is a code decision)

Two sites from this template should never look like siblings. Uniqueness comes from
combining variant props in `src/pages/index.astro`, tokens in `src/styles/custom.css`,
and the design process in [docs/DESIGN-DOCTRINE.md](./DESIGN-DOCTRINE.md) — not from
picking values out of a `business.json` block. The only design field left in
`business.json` is `design.fontPairing`.

| What | Where | Options |
|---|---|---|
| Font pairing | `design.fontPairing` in `business.json` | `classic` · `modern` · `elegant` · `warm` · `bold` · `editorial` · `playful` · `rounded` · `impact` · `poster` · `refined` · `techsans` · `serifnote` · `retro` · `handmade` (all Hebrew-capable; `handmade`/Amatic SC is display-only — short headings) |
| Hero layout | `<Hero variant="...">` prop in `index.astro` | `split` · `centered` · `full-bleed` |
| Services layout | `<Services layout="...">` prop in `index.astro` | `cards` · `list` · `panels` |
| Gallery layout | `<Gallery layout="...">` prop in `index.astro` | `grid` · `masonry` · `featured` |
| Section order | the order components appear in `index.astro` | any order; keep `content.nav` links in sync |
| Shape / rhythm | `--shape-radius-card`, `--shape-radius-button`, `--section-py` tokens, overridden in `src/styles/custom.css` | any value — never a literal radius or `py-*` |

That's still thousands of combinations before you even pick colors. Tips for choosing well:

- **Start from the client's character, not from what looks good in the demo.**
  A law office: `elegant` or `editorial` fonts + sharp tokens + a `list` services layout.
  A kids' party business: `warm` or `bold` fonts + pill tokens + a `cards` layout. A
  hair salon: `modern` fonts + rounded tokens + `masonry` gallery + `full-bleed` hero
  of their space.
- **`bold` (Karantina) is a condensed display font — it shouts.** Great for
  gyms/food trucks; wrong for clinics. `editorial` (David Libre serif) reads
  premium/established.
- **Reorder the sections in `index.astro` to match the sales story.** Trust-first
  business (therapist, accountant): `About` → `Testimonials` early. Visual business
  (renovations, catering): `Gallery` right after `Services`. Price-driven:
  `Services` → `FAQ` → `CTA`. Keep `content.nav` link order in sync.
- **`full-bleed` hero lives or dies by the photo.** Only use it with a genuinely
  good, wide client photo; with mediocre photos, `split` flatters more.
- **Palette: pull it from something real** — the client's logo, their storefront,
  their product. Brand colors: `primary` (CTAs), `secondary` (headings), `accent`
  (highlights); neutrals: `surface`, `surfaceAlt`, `ink`, `inkMuted`, `line` — a
  dark or deep-tinted site is a legitimate palette, not just the light default.
  The validator enforces WCAG AA contrast on 9 pairs computed against the real
  palette, so a failing combination is caught immediately — adjust lightness,
  don't fight it.
- **The copy is half the design.** `voice.persona`, `keywords`, and `doNotSay`
  exist so headlines don't sound templated. Write the hero headline the way this
  specific business owner would say it to a customer, not "ברוכים הבאים לאתר שלנו".
- **Photos beat every other choice.** Real photos of the client's work, lightly
  edited for consistent warmth/exposure, are the single biggest anti-template
  signal. Placeholder-quality stock kills the effect of every choice above.
- **Then design the page 0→100 following the doctrine.** Beyond variant props,
  every client site gets ONE creative concept expressed everywhere it helps:
  composition and section design as code, a color story in `src/styles/custom.css`
  (tinted/dark/gradient sections from the client's own colors, via `color-mix()`),
  and one characteristic motion — tuned `data-reveal` presets (including the
  `blur`/`clip` exceptions to transforms/opacity-only) plus, for a true signature
  move, `registerCustomAnimations()` in `src/lib/animation/custom.ts`. This is
  what turns "a clean page" into "feels like walking into their shop." Full
  contract (the floor, the toolkit, the divergence hard rules, the four-line
  design process) lives in [docs/DESIGN-DOCTRINE.md](./DESIGN-DOCTRINE.md) —
  read it first. One coherent concept beats ten scattered effects.
- **Judge it before calling it done.** Run the `design-review` skill (or
  `/design-review` in Claude Code) against the built site — it screenshots the
  real page and scores it against the doctrine's rubric. Rerun it any time
  after client feedback changes the design; it's built to be re-invoked, not
  a one-shot gate.

## Rules that keep you out of trouble

- **Never hardcode content or colors in components.** New copy → add a field to
  `business.schema.ts`, then `business.json`, then read via `getBusiness()`.
  Re-theming = editing JSON (`voice.palette`), never inline colors.
- **RTL is non-negotiable**: logical utilities only (`ms-*`, `me-*`, `ps-*`,
  `text-start`…), never `ml/mr/text-left`. Phone numbers/prices/emails get
  `class="force-ltr"`; mixed Hebrew/Latin runs get `<bdi>`. English site? Just set
  `"locale": "en"` — everything flips.
- **Animations**: use `data-reveal` / `data-reveal-group` attributes — never new
  GSAP/Lenis instances. Reduced-motion users get a static page automatically.
- **Windows**: save `business.json` as UTF-8 **without BOM** (a BOM breaks the build).
- **Links**: the sentinel `"whatsapp"` in any `href` resolves to the client's
  WhatsApp — use it for CTAs instead of pasting wa.me URLs.
- **Before committing**: `npm run test && npm run test:e2e` must be green. After an
  intentional visual change: `npx playwright test --grep @visual --update-snapshots`.

## Where things live (when you do need to look)

| | |
|---|---|
| `src/content/business/business.json` | Everything you edit |
| `src/content/business.schema.ts` | The contract (edit first when adding fields) |
| `docs/examples/demo-salon.business.json` | Filled reference |
| `src/components/sections/` | One `.astro` per section (variants live inside) |
| `src/styles/global.css` | Design tokens — extend here, never inline |
| `tests/smoke.spec.ts` | Update when adding user-visible behavior |
