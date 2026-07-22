# Business Template (Astro · Static · RTL-first)

Production-grade starter for small-business sites. One repo per client; all client-specific
content, branding, and SEO live in a single file — `src/content/business/business.json` —
validated by Zod at build time. Hebrew/RTL by default, flips to LTR with one flag.

Ships with: Astro 7 (static output), Tailwind CSS 4 (CSS-first), GSAP + ScrollTrigger + Lenis
(reduced-motion safe), self-hosted Heebo + Assistant, JSON-LD (LocalBusiness / Organization /
FAQPage), sitemap + robots, Web3Forms contact form, Biome, Husky, Playwright, Lighthouse CI.

## Per-client workflow

1. **Create the client repo.** On GitHub, mark this repo as a **Template repository**
   (Settings → General → check "Template repository", one time). Then per client:
   **Use this template → Create a new repository**, and:

   ```sh
   git clone <client-repo-url> && cd client-name
   npm install         # also installs the husky pre-commit hook
   ```

   (Without GitHub: `git clone <template-url> client-name && cd client-name && rm -rf .git && git init`.)

2. **Fill `src/content/business/business.json`** — facts (`data`), tone + palette (`voice`),
   and every visible string (`content`). This re-brands the whole site, including theme colors.
   Set `data.seo.siteUrl` to the production URL (drives canonical, sitemap, robots, JSON-LD).
   Set `locale` to `"he"` or `"en"` — this flips `lang`/`dir` site-wide.

3. **Validate**: `npm run validate:content` — checks the schema AND WCAG AA contrast of
   `voice.palette` (an invalid file also fails `npm run build`).

4. **Replace images**: drop client photos into `src/assets/images/` (referenced by filename in
   business.json) and `public/og-default.png` (1200×630). Placeholders can be regenerated with
   `npx tsx scripts/generate-placeholders.ts`.

5. **Contact form**: copy `.env.example` to `.env` and set `PUBLIC_WEB3FORMS_KEY`
   (free key from [web3forms.com](https://web3forms.com)). On Cloudflare Pages, add the same
   variable in the dashboard.

## Commands

| Command                    | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | Dev server at `http://localhost:4321`              |
| `npm run build`            | Static build to `dist/`                            |
| `npm run preview`          | Serve the built site                               |
| `npm run test`             | Content validation + Biome + `astro check`         |
| `npm run test:e2e`         | Playwright smoke tests (builds + serves itself)    |
| `npm run lhci`             | Lighthouse CI budgets (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1) — run `build` first |

First e2e run needs `npx playwright install chromium`.

**CI**: `.github/workflows/ci.yml` runs all of the above (including axe-core accessibility
checks and the Lighthouse budgets) on every push/PR. Recommended: protect `master` and require
the three jobs to pass before merge.

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
| `lighthouse` | Core Web Vitals / a11y / SEO audits (budgets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1) | None (needs Node ≥ 22) |
| `a11y` | axe-core WCAG audits, contrast + ARIA checks | None |
| `github` | Repos, PRs, Actions for the per-client workflow | `/mcp` → authenticate (OAuth, browser opens) |
| `cloudflare` | Cloudflare API — Pages deploys, DNS, domains | `/mcp` → authenticate (OAuth) |

Notes:

- `github` and `cloudflare` are intentionally **not** pre-approved — they can change real
  infrastructure, so Claude asks before each action. The other six are read-only/local and
  pre-approved in `.claude/settings.json`.
- Skip the OAuth servers entirely if you don't need them; everything else works without them.
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
coding conventions. `CLAUDE.md` points AI agents at the same contract.
