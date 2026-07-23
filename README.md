# Business Template (Astro · Static · RTL-first)

Production-grade starter for small-business sites. One repo per client; all client-specific
content, branding, and SEO live in a single file — `src/content/business/business.json` —
validated by Zod at build time. Hebrew/RTL by default, flips to LTR with one flag.

Ships with: Astro 7 (static output), Tailwind CSS 4 (CSS-first), GSAP + ScrollTrigger + Lenis
(reduced-motion safe), six self-hosted Hebrew-capable font pairings, JSON-LD (LocalBusiness /
Organization / WebSite / FAQPage), sitemap + robots, Web3Forms contact form, Biome, Husky,
Playwright, Lighthouse CI.

## One-time agency setup (owner, ~15 minutes)

Do this once; every client site afterwards starts from here.

1. **The template lives at github.com/RLGTEAM/BusinessTemplate (PUBLIC).** Rationale: on the GitHub Free plan,
   branch protection is only enforced on public repos, and public repos get unlimited free
   Actions minutes. The template contains no client data or secrets (`.env` is gitignored;
   `business.json` holds demo content only), and the `LICENSE` file keeps it
   all-rights-reserved — public to view, not licensed for reuse.
   **Client repos are always PRIVATE** — they hold real client data and don't need branch
   protection (Actions minutes on private repos: 2000 free/month, plenty for client CI).
2. **Settings → General → check "Template repository"** — enables "Use this template" for
   client repos with clean history.
3. **Branch protection** on `master`: require the three CI jobs (quality / e2e / lighthouse)
   to pass, require one review. (The job names appear in the checks picker after CI has run
   once — type e.g. "Validate" in the search box.)
4. **Enable the [Renovate GitHub App](https://github.com/apps/renovate)** on the template repo
   only — dependencies stay fresh here; client clones stay frozen at known-good versions.
5. **Cloudflare account**: one agency account; invite developers as members.
6. **Onboard a developer**: they need Node ≥ 22 + git. First time in any clone:
   `npm install`, `npx playwright install chromium`, open the folder in Claude Code (MCP
   servers self-configure — see below), and read [AGENTS.md](./AGENTS.md). That's the whole
   onboarding.

## New client → live site (the per-client flow)

A new client asked for a website. Step by step:

1. **Collect the brief** (sales call / intake form) — copy [docs/brief.md](./docs/brief.md)
   and fill it in; it's paste-ready for `/new-client`. Minimum needed — this list mirrors
   Step 0 of the `/new-client` skill, which will ask for anything missing:
   business name + legal name, what they do, address, phone, email, WhatsApp, hours,
   3–6 services with prices, service areas, socials, brand colors (if any), tone/voice
   preferences, photos, and the desired domain.
2. **Create the repo**: template repo → **Use this template → Create a new repository** →
   `client-name` (private). Then `git clone <client-repo-url> && cd client-name && npm install`.
3. **Fill the site**: open the folder in Claude Code and run **`/new-client`**, pasting the
   brief. It reads the brief (including the scraped raw-texture material), generates three
   design concepts and self-critiques them, commits the chosen concept to `docs/concept.md`,
   reshapes the per-client part of `business.json` + schema, designs and builds the page
   0→100 on the quality floor (see [docs/DESIGN-DOCTRINE.md](./docs/DESIGN-DOCTRINE.md)),
   enforces the WCAG palette contract, regenerates the OG image, and runs the full test
   gate — autonomously, surfacing every provisional fact and placeholder in its final report.
   Doing it by hand instead: edit `src/content/business/business.json`, then
   `npm run validate:content` → `npm run generate:og` → `npm run test` → `npm run test:e2e`.
4. **Real photos**: drop client photos into `src/assets/images/` keeping the filenames (or
   update the refs in business.json). Rebaseline visuals:
   `npx playwright test --grep @visual --update-snapshots`.
5. **Contact form key**: create a free [Web3Forms](https://web3forms.com) access key **using
   the client's email** (submissions go to that inbox). Put it in `.env` locally
   (copy `.env.example`) — and later in Cloudflare Pages env vars.
6. **Push** to the client repo. CI must be green.
7. **Deploy a preview**: connect the repo to Cloudflare Pages (see Deploy section below).
   The `*.pages.dev` URL is your client-approval link.
8. **Client feedback loop**: every copy/color/price change is a `business.json` edit → commit
   → auto-redeploy. No code changes for content feedback.
9. **Go live**: buy/point the domain, add it as a custom domain in Cloudflare Pages, set
   `data.seo.siteUrl` in business.json to the final domain, commit (this fixes canonical URLs,
   sitemap, robots, and JSON-LD), verify the deploy.
10. **Post-launch checks**: run `npm run build && npm run lhci` against the budgets; validate
    the structured data at [validator.schema.org](https://validator.schema.org) and Google's
    Rich Results test; add the site to Google Search Console and submit
    `https://<domain>/sitemap-index.xml`.
11. **Handoff**: confirm the client receives form submissions, hand over Search Console
    access, archive the brief in the client repo (e.g. `docs/brief.md`).

## Commands

| Command                    | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | Dev server at `http://localhost:4321`              |
| `npm run build`            | Static build to `dist/`                            |
| `npm run preview`          | Serve the built site                               |
| `npm run test`             | Content validation + Biome + `astro check`         |
| `npm run test:e2e`         | Playwright smoke + axe a11y tests (builds + serves itself) |
| `npm run test:ltr-build`   | Builds the English/LTR variant and checks its structure    |
| `npm run test:visual`      | Visual regression snapshots (local; rebaseline with `--update-snapshots`) |
| `npm run generate:og`      | Regenerate the OG image from business.json name + palette |
| `npm run lhci`             | Lighthouse CI budgets (LCP ≤ 2.5s, TBT ≤ 200ms as the INP lab proxy, CLS ≤ 0.1) — run `build` first |

First e2e run needs `npx playwright install chromium`.

**CI**: `.github/workflows/ci.yml` runs all of the above (including axe-core accessibility
checks and the Lighthouse budgets) on every push/PR. Recommended: protect `master` and require
the three jobs to pass before merge.

Notes:

- **The template ships as a placeholder skeleton** — business.json contains `[bracketed]`
  placeholders and a neutral palette. A fully-filled example lives at
  `docs/examples/demo-salon.business.json`.
- Every site auto-generates its SEO/AEO surface from business.json: meta/OG/canonical,
  4 JSON-LD blocks (LocalBusiness + OfferCatalog, Organization, WebSite, FAQPage), sitemap,
  robots.txt, **llms.txt** (AI answer engines), web manifest + icon set, 404 page, and
  security/cache headers (`public/_headers`).
- **Legal pages** ship built-in: `/accessibility-statement/` (mandatory for Israeli businesses,
  ת"י 5568 — fill the real coordinator details per client!) and `/privacy/`, both generated
  from `content.legal` and linked in the footer.
- **Cookies & consent**: the template is cookieless by default (self-hosted fonts, cookieless
  Cloudflare Analytics) — no banner needed. Setting `data.analytics.gtagId` or `metaPixelId`
  automatically shows a consent banner and keeps those trackers blocked until the visitor
  accepts (choice persists in localStorage). When enabling a tracker, also update the
  `content.legal.privacy` text to disclose it.
- Visual snapshots are per-machine and NOT committed (gitignored): the first
  `npm run test:visual` creates baselines (that run reports "missing snapshot" — rerun to go
  green). Rebaseline after intentional design changes with
  `npx playwright test --grep @visual --update-snapshots`.
- `renovate.json` keeps the pinned dependencies fresh (enable the Renovate GitHub App on the
  **template** repo only — grouped PRs, majors held for approval). Client clones stay frozen.
- Claude Code users get a `/new-client` skill (`.claude/skills/new-client/`) that walks the
  whole fill-validate-test pipeline for a new client brief.

## MCP setup for AI agents (first time — nothing to install)

The repo ships with `.mcp.json` (declares the servers) and `.claude/settings.json`
(auto-enables them and pre-approves the safe ones). If you use Claude Code, **it just
works on your first session in this folder** — the local servers run via `npx` on demand,
the remote ones connect over HTTP. Run `/mcp` inside Claude Code to see server status.

| Server | What it's for | First-time action needed |
| --- | --- | --- |
| `context7` | Current docs for Tailwind 4, GSAP, Lenis, Zod, Playwright | None |
| `astro-docs` | Official Astro docs (remote, always current) | None |
| `playwright` | Drive a real browser to verify UI/RTL changes | None |
| `chrome-devtools` | Console, network, performance traces | None |
| `lighthouse` | Core Web Vitals / a11y / SEO audits (budgets: LCP ≤ 2.5s, TBT ≤ 200ms as the INP lab proxy, CLS ≤ 0.1) | None (needs Node ≥ 22) |
| `a11y` | axe-core WCAG audits, contrast + ARIA checks | None |
| `github` | Repos, PRs, Actions for the per-client workflow | Set the `GITHUB_MCP_PAT` env var (see below) |
| `cloudflare` | Cloudflare API — Pages deploys, DNS, domains | `/mcp` → authenticate (OAuth). Only needed in CLIENT repos when deploying |

Notes:

- `github` and `cloudflare` are intentionally **not** pre-approved — they can change real
  infrastructure, so Claude asks before each action. The other six are read-only/local and
  pre-approved in `.claude/settings.json`.
- **GitHub auth**: GitHub's MCP server doesn't support the OAuth flow Claude Code uses
  ("does not support dynamic client registration"), so it authenticates with a token instead.
  Create a fine-grained PAT (github.com → Settings → Developer settings → Personal access
  tokens; scope it to your org's repos), then set it once:
  `setx GITHUB_MCP_PAT "github_pat_..."` and restart the terminal. The token is read from
  the environment — never committed. Until it's set, the `github` server just shows as
  disconnected in `/mcp`, which is harmless.
- Skip both infra servers entirely if you don't need them; everything else works without them.
  (`gh` CLI is a fine alternative for GitHub tasks.)
- Other MCP clients (Cursor, VS Code, Windsurf): copy the entries from `.mcp.json` into your
  client's MCP config — the format is identical or near-identical.

## Deploy — Cloudflare Pages

The site is fully static, so **no adapter is needed** (the Cloudflare adapter is only for SSR).

1. Push the client repo to GitHub/GitLab.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings: framework preset **Astro**, build command `npm run build`,
   output directory `dist`.
4. Add env var `PUBLIC_WEB3FORMS_KEY` (Production + Preview).
5. Set the custom domain, then make sure `data.seo.siteUrl` in business.json matches it and
   redeploy (it drives canonical URLs, sitemap, robots and JSON-LD).

CLI alternative: `npx wrangler pages deploy dist`.

## Where things live

See [AGENTS.md](./AGENTS.md) for the folder map, the business.json contract, RTL rules, and
coding conventions. `CLAUDE.md` points AI agents at the same contract. For humans:
[docs/CLIENT-SITE-GUIDE.md](./docs/CLIENT-SITE-GUIDE.md) is the new-developer walkthrough for
building a client site, and [docs/DESIGN-DOCTRINE.md](./docs/DESIGN-DOCTRINE.md) is the design
contract — the quality floor, the toolkit, and the required design process for building each
client site 0→100.
