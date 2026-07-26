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
   - `content` — every visible string, section by section. The shipped file
     has only the frozen core (`nav`, `ui`, `consent`, `notFound`, `legal`)
     plus two optional canonical blocks (`faq`, `shell`). Author the rest
     yourself, schema-first: reshape `business.schema.ts` to match the page
     you're designing, then write the JSON. Delete `content.shell` once you
     replace the starter page (step 3).
3. **Pick a font pairing** (`design.fontPairing` in `business.json`) and build
   the page (see "Building the page" below) — `src/pages/index.astro` ships
   as an unbuilt contract shell; replace it entirely.
4. **Add images, schema-first**: the skeleton ships no image fields. Add them to
   `business.schema.ts`, then `business.json`, as the design needs (see
   [docs/RECIPES.md](./RECIPES.md) recipe 5 for the `resolveImage()` pattern), then
   drop the client's photos into `src/assets/images/` under those filenames. Starter
   placeholders while you design: `npm run generate:placeholders`.
5. **Regenerate the OG image + favicon/icon set**: `npm run generate:og`.
6. **Validate + test** (do this early and often — schema failures fail the build):
   ```
   npm run validate:content   # fastest feedback on business.json
   npm run test               # schema + lint + typecheck
   npm run test:e2e           # smoke + axe (builds itself, port 4322; visual is npm run test:visual, local-only)
   ```
7. **Final sweep before launch**:
   - `rg "\[" src/content/business/business.json` → only the bidi test line may match.
   - `content.legal.accessibility.coordinator` has **real** contact details —
     the accessibility statement is a legal requirement in Israel (ת"י 5568).
   - `data.seo.siteUrl` points at the real domain (it feeds the sitemap + JSON-LD).

## Building the page (design is a code decision)

The template ships **no** prebuilt sections or UI primitives — every component is
built from zero, per client. Two sites from this template should never look like
siblings; there's nothing to reskin into sameness because there's nothing prebuilt
to start from. Before building, read:

- [docs/RECIPES.md](./RECIPES.md) — nine RTL/a11y-correct PATTERNS (not full
  components) for the things worth not re-deriving each time: section skeleton,
  accessible mobile nav, the contact-form headless contract, the RTL survival kit,
  images via `resolveImage()`, footer with legal links, the scroll-aware header,
  the marquee/parallax/counter motion helpers, and the mobile sticky contact bar.
- [docs/DESIGN-DOCTRINE.md](./DESIGN-DOCTRINE.md) — the floor, the page contract,
  the toolkit (tokens, animation, recipes), and the four-line design process.

The only design field left in `business.json` is `design.fontPairing`; everything
else — composition, section design, shape/rhythm tokens, color story — is a code
decision.

Tips for choosing well:

- **Start from the client's character, not from a generic industry stereotype.**
  A law office reads premium with a serif display pairing, sharp-edged tokens, and
  a text-forward services layout. A kids' party business wants a loud display
  pairing, pill-shaped tokens, and a visual, card-heavy layout. Let the metaphor
  (docs/DESIGN-DOCTRINE.md's four-line process) drive every one of these choices.
- **`handmade` (Amatic SC) is a display-only font — headings, never body copy,
  never long headings** (it turns illegible past a few words). Condensed/impact
  pairings shout — great for gyms/food trucks, wrong for clinics. Serif pairings
  read premium/established.
- **Order sections to match the sales story**, then keep `content.nav` link
  order in sync. Trust-first business (therapist, accountant): testimonials and
  credentials early. Visual business (renovations, catering): gallery right after
  services. Price-driven: services → FAQ → CTA.
- **A full-bleed hero photo lives or dies by the photo.** Only use one with a
  genuinely good, wide client photo; with mediocre photos, a contained/split
  treatment flatters more.
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
- **Then design the page 0→100 following the doctrine.** Every client site gets
  ONE creative concept expressed everywhere it helps:
  composition and section design as code, a color story in `src/styles/custom.css`
  (tinted/dark/gradient sections from the client's own colors, via `color-mix()`),
  and one characteristic motion — tuned `data-reveal` presets (including the
  `blur`/`clip` exceptions to transforms/opacity-only) plus, for a true signature
  move, `registerCustomAnimations()` in `src/lib/animation/custom.ts`. This is
  what turns "a clean page" into "feels like walking into their shop." Full
  contract (the floor, the toolkit, the divergence hard rules, the four-line
  design process, and the Craft bars — mobile-first, a designed header, the
  five-part aliveness inventory, anti-AI tells) lives in
  [docs/DESIGN-DOCTRINE.md](./DESIGN-DOCTRINE.md) — read it first. One
  coherent concept beats ten scattered effects. [docs/PLAYBOOK.md](./PLAYBOOK.md)
  is the owner's operating procedure for the whole engagement, clone to
  launch — this guide is the design/build detail behind one step of it.
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
| `docs/RECIPES.md` | RTL/a11y-correct patterns for nav, forms, section skeleton |
| `src/styles/global.css` | Design tokens — extend here, never inline |
| `tests/smoke.spec.ts` | Update when adding user-visible behavior |
