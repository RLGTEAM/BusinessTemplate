# Building a client landing page from this template

A practical guide for a developer picking up this repo for the first time to ship a
landing page for a real customer. It's a fill-in-the-blanks machine: **you edit one
JSON file, swap images, and validate**. You should almost never touch a component.

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
   - `voice` — tone, keywords, `palette` (3 hex colors + mood).
   - `content` — every visible string, section by section.

   A fully-filled reference lives at `docs/examples/demo-salon.business.json`.
3. **Pick the design variants** (see "Making it look unique" below) in the
   `design` block.
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

## Making it look unique (the anti-sameness system)

Two sites from this template should never look like siblings. Uniqueness comes from
**combinations**, not custom code. The `design` block gives you six independent dials:

| Dial | Options | What it changes |
|---|---|---|
| `fontPairing` | `classic` · `modern` · `elegant` · `warm` · `bold` · `editorial` | Display + body fonts (all Hebrew-capable) |
| `hero` | `split` · `centered` · `full-bleed` | Above-the-fold layout |
| `shape` | `rounded` · `sharp` · `pill` | Corner radius of cards/buttons |
| `density` | `airy` · `regular` · `compact` | Vertical rhythm of sections |
| `servicesLayout` | `cards` · `list` · `panels` | Services section |
| `galleryLayout` | `grid` · `masonry` · `featured` | Gallery section |
| `sectionOrder` | any permutation of the 7 middle sections | Page narrative |

That's **thousands of combinations before you even pick colors**. Tips for choosing well:

- **Start from the client's character, not from what looks good in the demo.**
  A law office: `elegant` or `editorial` + `sharp` + `airy` + `list`. A kids' party
  business: `warm` or `bold` + `pill` + `regular` + `cards`. A hair salon:
  `modern` + `rounded` + `masonry` gallery + `full-bleed` hero of their space.
- **`bold` (Karantina) is a condensed display font — it shouts.** Great for
  gyms/food trucks; wrong for clinics. `editorial` (David Libre serif) reads
  premium/established.
- **Change the section order to match the sales story.** Trust-first business
  (therapist, accountant): `about` → `testimonials` early. Visual business
  (renovations, catering): `gallery` right after services. Price-driven:
  `services` → `faq` → `cta`. Keep `content.nav` link order in sync.
- **`full-bleed` hero lives or dies by the photo.** Only use it with a genuinely
  good, wide client photo; with mediocre photos, `split` flatters more.
- **Palette: pull it from something real** — the client's logo, their storefront,
  their product. Three colors: `primary` (brand/CTAs), `secondary` (dark ink for
  headings), `accent` (highlights). The validator enforces WCAG AA contrast on all
  pairs the template actually uses, so a failing palette is caught immediately —
  adjust lightness, don't fight it.
- **The copy is half the design.** `voice.persona`, `keywords`, and `doNotSay`
  exist so headlines don't sound templated. Write the hero headline the way this
  specific business owner would say it to a customer, not "ברוכים הבאים לאתר שלנו".
- **Photos beat every other dial.** Real photos of the client's work, lightly
  edited for consistent warmth/exposure, are the single biggest anti-template
  signal. Placeholder-quality stock kills the effect of every choice above.
- **Then build the experience layer.** Beyond the dials, every client site gets
  ONE creative concept expressed across the page: a color story in
  `src/styles/custom.css` (tinted/dark/gradient sections from the client's own
  colors), motifs per section in `SectionDecor.astro`, a hero statement piece in
  `SignatureBackdrop.astro`, optionally a fully custom section, and one
  characteristic motion in `signature.ts`. This is what turns "a clean page"
  into "feels like walking into their shop." Strict contract (tokens, contrast
  pairs, RTL, reduced-motion, same test gate) — read `docs/CREATIVE-CONTRACT.md`
  first. One coherent concept beats ten scattered effects.

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
