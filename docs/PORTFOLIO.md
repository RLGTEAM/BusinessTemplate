# Portfolio — design fingerprints of shipped sites

**Why this file exists:** each client build runs in a fresh repo with no
memory of the others, and the model's stable taste re-derives its favorite
moves every time believing they're original. The measured result across the
first four builds: **three of four chose the same metaphor family**
(time-of-day mapped to a color arc down the page), **three of four chose
the same font pairing** (`poster` / Suez One), and **all four chose a
gold/amber accent** on a warm cream/dark palette. Each looked distinctive
alone; the portfolio looks like one designer repeating themselves.

This file is the cross-client memory that breaks that loop. It records the
FINGERPRINT of every shipped site — not the design itself, just the axes on
which sameness happens.

**How it's used (binding):**

- `/new-client` Step 1 reads this file before generating concepts. Every
  candidate states its distance from each entry, and the chosen concept
  must not repeat an entry's metaphor family — a family already shipped is
  spent material, not a foundation to vary.
- `/design-review` scores Distinctiveness against these entries: a build
  sharing metaphor family + page form, or font pairing + accent family,
  with any entry caps Distinctiveness at 2.
- At handoff (PLAYBOOK step 9), append the new site's row — in the
  TEMPLATE repo, so every future clone carries it. Keep entries to the
  table row plus at most two lines of notes.

A repeat is only legitimate when the client's world genuinely demands it —
argued explicitly in `docs/concept.md` against the specific prior entry,
never silently.

## Shipped sites

| # | Client (date) | Business | Metaphor family | Page form | Palette family | Accent | Font pairing | Signature element | Motion identity |
|---|---|---|---|---|---|---|---|---|---|
| 1 | THE-TREE (2026-07) | restaurant | **time-of-day arc** (sunset → late night) | vertical band stack | dark green night + cream | gold `#d9a441` | `refined` | cream menu card "lit" mid-night; ticker | light draining section by section |
| 2 | natan-meathouse (2026-07) | steakhouse | **ritual sequence** (the board arrives, the evening unfolds) | vertical band stack | near-black char + cream | gold `#d8a13c` (ember red 2nd) | `poster` | the board (pinned/tilted); sear divider | sear/char, slats |
| 3 | under-the-tree (2026-07) | café | **time-of-day arc** ("שעון הצל", 07:00 → midnight) | vertical band stack | cream/kraft + forest | gold `#a99841` | `poster` | shade-clock rail; canopy; ticker | one day passing |
| 4 | barbarini (2026-08) | café-restaurant | **time-of-day arc** (dawn → night bands) | vertical band stack | cream/sand + night wine | amber `#E09A2E` | `poster` | taboon arch (only curve on the site); day-rail scrub | "falling light" — settle, never snap |
| 5 | nook-cafe (2026-08) | café | **the place itself** — photo-led; the courtyard is the product | full-bleed video hero → framed photography beside copy → one dark band | warm cream/kraft + espresso | rust `#e2703a` | `bold` (Karantina) | hero video loop of the branded takeaway cups; menu set as a ruled document with scrubbed leader dots | "sunlight" — slow push-in, photographs drift inside their frames |

## Spent material (do not reuse without an explicit argument)

- **Metaphor:** time-of-day / passage-of-light mapped to surface color down
  the page. Shipped three times. Retired.
- **Page form:** all four sites are a vertical stack of full-width color
  bands: `Header → Hero → bands → FAQ → Visit/Contact → Footer → ContactBar`.
  The next build must at minimum argue why this form and not another —
  better, ship a different one (see DESIGN-DOCTRINE on page forms).
- **Accent:** the gold/amber family (4/4). A warm business does not require
  a gold accent.
- **Font pairing:** `poster` (Suez One) — 3/4. Twelve other pairings exist;
  `astro.config.mjs` documents each one's personality.
- **Furniture:** a marquee/ticker band (3/4); a "cream card glowing on a
  dark band" moment (2/4).

- **Photo-led composition + a warm rust accent** (#5). Not retired — but a
  sixth food client leading with full-bleed photography and a warm accent is
  repeating that entry, not diverging from it.

All five clients so far are food businesses — some SECTION overlap (menu,
hours, reviews) is the client mix, not a failure. The fingerprint axes
above are design choices, and those have no such excuse.

**What #5 cost, and why it is written here.** nook-cafe is the first
photo-led build and the first with a video hero — but only on the second
attempt. The first shipped typographically because the client's photographs
were withheld as "scraped from Instagram", and the operator rejected the
result as cold and dated. The rebuild around their real photography was a
different site entirely: new palette (sampled from the photos, not invented),
new font, new composition.

The lesson is the one `/fill-brief` already states and that build ignored:
**settle the photography question before concepting, never after.** A page
composed without images was designed for images that do not exist, and
re-skinning it later is not a substitute. When the operator supplies client
media, ASK whether it may be used rather than silently applying the
scraped-images rule — that rule exists to protect against unknown rights, not
to override the operator's own client material.
