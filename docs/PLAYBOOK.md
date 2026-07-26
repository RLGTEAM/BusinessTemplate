# Playbook — from client call to live site

The owner's operating procedure, condensed. One repo per client; run this
top to bottom for every new engagement. Details of each step live elsewhere
([README.md](../README.md), [docs/brief.md](./brief.md),
[docs/DESIGN-DOCTRINE.md](./DESIGN-DOCTRINE.md)) — this page is the order of
operations, not a replacement for them.

1. **Duplicate.** Template repo → **Use this template** → a new private
   `client-name` repo → `git clone <client-repo-url> && cd client-name` →
   `npm install`. First time on a machine, also run
   `npx playwright install chromium` (once per machine, not per client).

2. **Scrape.** Open the client's socials and Google Business profile in a
   Chrome tab group; drive Claude-in-Chrome to fill `docs/brief.md` from
   what it finds. Tag every fact `[scraped]` (found online, unverified) or
   `[client-confirmed]` (the client said it directly) — `/new-client` treats
   scraped-only NAP, prices, and hours as provisional and lists them for
   confirmation before launch. Dump raw texture into the brief's "Raw
   texture" section too: verbatim reviews, the business's own words, what
   their photos look and feel like — the design concept gets built from this
   material, not from generic prompting.

3. **Pre-flight** (before you run `/new-client`, confirm):
   - `docs/brief.md` is saved and filled in.
   - Accessibility-coordinator details if the client has them ready — this
     is BLOCKING at launch if still missing (ת"י 5568 is a legal
     requirement for Israeli businesses; ship without it and the site
     isn't launch-ready no matter how green the test gate is).
   - Client photos are in `src/assets/images/` if available (placeholders
     are fine to start from otherwise — `scripts/generate-placeholders.ts`).
   - `.env` exists (copy `.env.example`) with a Web3Forms key created on the
     **client's** email — only if they actually want a contact form.
   - A note on what previous clients' sites looked like — distinctiveness
     input for the concept stage, so this build doesn't rhyme with the last
     one.

4. **Run `/new-client`** from the repo root. It runs unattended, start to
   finish: three design concepts → self-critique → the chosen concept
   committed to `docs/concept.md` → schema-first content (schema, then
   `business.json`) → a mobile-first build of every section from zero →
   design-review rounds (screenshots, scored against the rubric, logged to
   `docs/design-review.md`) → the full test gate → a final report.

5. **Read the report bottom-up** — BLOCKING items first, then anything
   flagged "confirm with client." Run `npm run preview` and review the site
   on your **phone** first; desktop is the adaptation, not the primary
   canvas.

6. **Feedback loop.** Copy, price, or fact changes are always a
   `business.json` edit → commit → redeploy — never a code change. Design
   feedback ("this feels off") goes to Claude as a description of what's
   wrong, not a prescribed fix; after any design change, invoke
   `/design-review` again to re-judge the result and log the new verdict.

7. **Deploy a preview.** Push the repo → Cloudflare Pages (Workers & Pages →
   Create → Pages → Connect to Git; framework preset Astro, build command
   `npm run build`, output directory `dist` — see README's Deploy section)
   → add the `PUBLIC_WEB3FORMS_KEY` env var (Production + Preview). The
   `*.pages.dev` URL Cloudflare assigns is the client-approval link — send
   that, not a custom domain, and run the feedback loop (step 6) against it
   until the client actually signs off.

8. **Go live.** Only after client approval: buy/point the domain, set it as
   the custom domain in Cloudflare Pages, update `data.seo.siteUrl` in
   `business.json` to match it, commit, and redeploy (fixes canonical URLs,
   sitemap, robots, JSON-LD). Post-launch: `npm run build && npm run lhci`
   against the budgets; validate the structured data at
   [validator.schema.org](https://validator.schema.org) and Google's Rich
   Results test; add the site to Google Search Console and submit
   `https://<domain>/sitemap-index.xml`.

9. **Handoff.** Send a real test submission through the contact form and
   CONFIRM it actually landed in the client's inbox — a bad Web3Forms key
   fails silently and loses every lead with nothing in the test gate to
   catch it. Hand over Google Search Console access to the client (or their
   marketing contact). Archive the filled `docs/brief.md` in the client
   repo as the record of what was agreed.
