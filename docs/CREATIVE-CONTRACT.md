# The creative contract — signature moments

The template constrains **how** things are built (stack, tokens, RTL, lifecycle,
test gates). It does not constrain **what** you imagine. This document defines the
one well-lit place where per-client creativity lives, so a record store can get
spinning vinyl and a bakery can get drifting flour dust — without forking a single
section or breaking a single rule.

**The rule of one:** every client site gets at most ONE signature moment. The rest
of the page stays calm — that restraint is what makes the moment land, and what
keeps the site fast and accessible. Spend your entire creative budget in one place.

## Where creativity is allowed

| Mount point | File | Use it for |
|---|---|---|
| Hero backdrop | `src/components/custom/SignatureBackdrop.astro` | Decorative layers behind/around the hero: motifs, floating objects, parallax art. Rendered inside every hero variant; the hero `<section>` is `position: relative`. |
| Signature section | `src/components/custom/Signature.astro` | A full custom section. Activate by adding `"signature"` to `design.sectionOrder` (any position, at most once). |
| Signature animations | `src/components/custom/signature.ts` → `registerSignature()` | Continuous or scroll-driven GSAP work: rotation loops, scrubbed timelines, counters, marquees. |

All three ship as no-ops — a fresh clone renders exactly the stock template.

## What the sandbox gives you for free

`registerSignature()` runs **inside** the template's
`gsap.matchMedia("(prefers-reduced-motion: no-preference)")` context:

- Reduced-motion users never execute your code — so your markup must look
  correct as a static image (this is also just good design).
- Tweens/ScrollTriggers you create synchronously are auto-reverted on page swap;
  no manual cleanup. Return a cleanup function only for listeners/observers/rAF
  loops you create yourself.
- Lenis smooth scroll and ScrollTrigger are already synced; `gsap` and
  `gsap/ScrollTrigger` are already in the bundle — importing them adds ~0 bytes.

For simple entrances, you may not need JS at all: `data-reveal`,
`data-reveal="slide-start|slide-end|scale"`, and `data-reveal-group` work inside
custom markup too.

## The rules (same fence as everywhere else)

1. **Strings** come from `content.signature` (`title` + free-form `strings` map)
   via `getBusiness()`. Never hardcode copy.
2. **Colors** come from tokens: `var(--color-primary|secondary|accent|surface|...)`
   or the mapped Tailwind utilities. Never literal hex.
3. **RTL**: logical properties/utilities only. X-offsets in JS/CSS multiply by
   `var(--dir-factor)`; GSAP x-slides through the `reveal.ts` helpers mirror
   automatically — raw `gsap.to(x: 100)` does not, so multiply yourself.
4. **Decorative means decorative**: backdrops get `aria-hidden="true"` and
   `pointer-events-none`; they must not trap focus, steal taps, or carry meaning
   that isn't available elsewhere.
5. **Animate transforms/opacity only.** No layout-property animation, no CLS.
6. **No new dependencies** without a pinned version and a written reason.
   Inline SVG + GSAP covers nearly everything.
7. **The gate decides**: `npm run test && npm run test:e2e && npm run test:ltr-build`
   must stay green, and Lighthouse budgets must hold (LCP ≤ 2.5s, TBT ≤ 200ms,
   CLS ≤ 0.1). A signature moment that fails the gate isn't finished.
8. A signature section is still a section: `<section id="signature">`,
   `scroll-mt-20`, `section-pad`. If it appears in `content.nav`, keep nav order
   consistent with `sectionOrder`.

## Worked example — record store ("patiphone") vinyl

`business.json` (client repo):

```json
"design": { "hero": "split", "sectionOrder": ["services", "about", "gallery", "testimonials", "faq", "cta", "contact"] },
"content": { "signature": { "strings": { "vinylLabel": "מאז 1987" } } }
```

`SignatureBackdrop.astro` — a vinyl disc peeking from the corner, drawn with tokens:

```astro
---
import { getBusiness } from "@/lib/business";
const business = await getBusiness();
const label = business.content.signature?.strings.vinylLabel ?? "";
---

<div
  aria-hidden="true"
  class="pointer-events-none absolute -top-24 -end-24 size-96 opacity-[0.08]"
>
  <svg id="signature-vinyl" viewBox="0 0 200 200" class="size-full">
    <circle cx="100" cy="100" r="98" fill="var(--color-secondary)" />
    <circle cx="100" cy="100" r="60" fill="none" stroke="var(--color-surface)" stroke-width="0.5" />
    <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-surface)" stroke-width="0.5" />
    <circle cx="100" cy="100" r="30" fill="var(--color-accent)" />
    <text x="100" y="104" text-anchor="middle" class="text-[8px]" fill="var(--color-secondary)">{label}</text>
  </svg>
</div>
```

`signature.ts` — slow spin, sped up by scroll velocity:

```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function registerSignature(): (() => void) | undefined {
  const vinyl = document.getElementById("signature-vinyl");
  if (!vinyl) return undefined;

  // Constant slow rotation — rotation is direction-neutral, no dir-factor needed.
  gsap.to(vinyl, { rotation: 360, duration: 12, ease: "none", repeat: -1 });

  // Scroll gives it a push, like a hand on the platter.
  const spin = gsap.to(vinyl, { rotation: "+=180", ease: "none", paused: true });
  const st = ScrollTrigger.create({
    trigger: "#hero",
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => spin.progress(Math.abs(self.getVelocity()) / 5000),
  });

  return () => st.kill(); // tweens revert automatically; the trigger we made by hand
}
```

Then run the gate, check the reduced-motion experience (static vinyl = still a
nice motif), rebaseline visuals **only in the client repo** (`npx playwright test
--grep @visual --update-snapshots` — this is an intentional visual change), and ship.

## The promote loop

When a client's signature idea proves broadly useful, promote it into the
template as a curated variant (schema enum → tokens/markup → AGENTS.md) or a new
`data-reveal` preset — via a normal PR against the template repo, generalized and
token-driven. Client repos stay free to be weird; the template only absorbs the
winners. Never copy client-specific code between client repos — promote or rewrite.
