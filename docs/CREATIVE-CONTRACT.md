# The creative contract — one concept, many expressions

The template constrains **how** things are built (stack, tokens, RTL, lifecycle,
test gates). It does not constrain **what** you imagine. Each client site should
be an *experience* — colorful in the business's colors, carrying the feeling of
the business — not a reskin of the same skeleton. This document defines the
surfaces where that experience is built.

**The rule: ONE concept, expressed everywhere it helps.** Pick a single metaphor
from the client's world (record store → vinyl and grooves; bakery → warmth, flour,
rounded softness; electrician → circuit lines and glow). Then let that one concept
express itself across the page — color story, per-section motifs, motion identity,
a custom section. What's forbidden is not *quantity* but *incoherence*: ten
unrelated effects read as noise; one concept in five places reads as identity.

## The creative surfaces

| Surface | File | Use it for |
|---|---|---|
| **Color story / atmosphere** | `src/styles/custom.css` | Re-skin section surfaces: tinted, dark, or gradient backgrounds, color-blocking the page's rhythm, texture. Loaded after `global.css`; the template ships it empty. |
| **Per-section decor** | `src/components/custom/SectionDecor.astro` | Rendered as the first child of EVERY content section (`section` prop tells you which). Motifs, dividers, floating shapes, grain — each section gets its own expression of the concept. |
| **Hero backdrop** | `src/components/custom/SignatureBackdrop.astro` | The above-the-fold statement piece, rendered inside every hero variant. |
| **Custom section** | `src/components/custom/Signature.astro` | A fully bespoke section — add `"signature"` to `design.sectionOrder` (at most once). |
| **Motion identity** | `src/components/custom/signature.ts` → `registerSignature()` | Continuous/scroll-driven GSAP: rotations, scrubbed timelines, parallax, counters, marquees — for ALL custom layers. |

All surfaces ship as no-ops — a fresh clone renders the stock template.

## Positioning cheat-sheet for decor

Section roots are `relative isolate`, so inside `SectionDecor`:

- `absolute inset-0 -z-10 pointer-events-none` → art **behind the content** but
  above the section's background color (this is the usual choice);
- `absolute inset-0 pointer-events-none opacity-10` → subtle overlay **on top**
  (grain, particles).

## What the sandbox gives you for free

`registerSignature()` runs **inside** the template's
`gsap.matchMedia("(prefers-reduced-motion: no-preference)")` context:

- Reduced-motion users never execute your code — the page must look complete
  and intentional as a static composition (design the still frame first).
- Tweens/ScrollTriggers created synchronously are auto-reverted on page swap.
  Return a cleanup function only for listeners/observers/rAF loops you own.
- Lenis smooth scroll and ScrollTrigger are already synced; `gsap` and
  `gsap/ScrollTrigger` are already in the bundle — importing them adds ~0 bytes.

For entrances, `data-reveal` / `data-reveal="slide-start|slide-end|scale"` /
`data-reveal-group` work inside custom markup too — no JS needed.

## The rules (same fence as everywhere else)

1. **Strings** come from `content.signature` (`title` + free-form `strings` map)
   via `getBusiness()`. Never hardcode copy.
2. **Colors** come from tokens: `var(--color-primary|secondary|accent|surface|...)`
   or the mapped Tailwind utilities. Never literal hex. `color-mix()` with tokens
   is the way to get tints, glows, and gradients from the client's three colors.
3. **Contrast is non-negotiable**: text sits ONLY on the validated pairs
   (`text-primary` on `bg-surface`; on dark/secondary surfaces use `text-surface`,
   like the full-bleed hero). Decor behind text must stay low-contrast enough not
   to break readability — when in doubt, run the axe suite (`npm run test:e2e`).
4. **RTL**: logical properties/utilities only. X-offsets multiply by
   `var(--dir-factor)`; gradients use `var(--angle-brand)`; raw GSAP `x:` values
   don't auto-mirror — multiply yourself.
5. **Decorative means decorative**: `aria-hidden="true"` + `pointer-events-none`;
   never trap focus, steal taps, or carry meaning that isn't available elsewhere.
6. **Animate transforms/opacity only.** No layout-property animation, no CLS.
7. **No new dependencies** without a pinned version and a written reason.
   Inline SVG + GSAP + `color-mix()` covers nearly everything.
8. **The gate decides**: `npm run test && npm run test:e2e && npm run test:ltr-build`
   green, Lighthouse budgets hold (LCP ≤ 2.5s, TBT ≤ 200ms, CLS ≤ 0.1). An
   experience that fails the gate isn't finished. Custom-layer changes are
   intentional visual changes — rebaseline visuals in the client repo.
9. A signature section is still a section: `<section id="signature">`,
   `scroll-mt-20`, `section-pad`; keep `content.nav` consistent with `sectionOrder`.

## Designing the experience (do this before coding)

Write the concept down in four lines — if you can't, it isn't one concept yet:

1. **Metaphor**: the one thing from the client's world (vinyl / steam / thread).
2. **Color story**: which sections are light, tinted, dark; where the accent
   burns brightest (usually the CTA). The page should have a rhythm, not stripes.
3. **Motif system**: the 1–2 shapes derived from the metaphor and where each
   section shows them (grooves in services, a spinning disc in the hero…).
4. **Motion identity**: the ONE characteristic movement (slow rotation / drift /
   pulse) reused everywhere motion appears — including the `data-reveal` choices.

## Worked example — record store ("patiphone")

Concept: *vinyl*. Color story: hero light with a groove backdrop, testimonials
dark like a record sleeve, CTA accent-hot. Motif: concentric grooves. Motion:
slow constant rotation.

`custom.css` — the color story:

```css
#testimonials {
  background: var(--color-secondary);
}
#cta {
  background: linear-gradient(
    var(--angle-brand),
    color-mix(in oklab, var(--color-accent) 24%, var(--color-surface)),
    var(--color-surface)
  );
}
```

(Testimonials text then uses the dark-surface pattern — `text-surface` — via a
few scoped rules; same validated pair the full-bleed hero uses.)

`SectionDecor.astro` — grooves behind services, sleeve-corner on testimonials:

```astro
---
interface Props { section: string }
const { section } = Astro.props;
---

{
  section === "services" && (
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]">
      <svg class="absolute -start-40 top-10 size-[30rem]" viewBox="0 0 200 200">
        {[95, 80, 65, 50].map((r) => (
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-secondary)" stroke-width="1" />
        ))}
      </svg>
    </div>
  )
}
```

`SignatureBackdrop.astro` + `signature.ts` — the spinning disc (see git history
of this file for the full version): an SVG vinyl in the hero corner,
`gsap.to(vinyl, { rotation: 360, duration: 12, repeat: -1 })`, plus a
scroll-velocity push via one hand-made ScrollTrigger (killed in the cleanup).

Then: gate, check the reduced-motion still frame, rebaseline visuals **in the
client repo**, ship.

## The promote loop

When a client's experience idea proves broadly useful, promote it into the
template as a curated variant (schema enum → tokens/markup → AGENTS.md) or a new
`data-reveal` preset — generalized and token-driven, via a normal PR. Client
repos stay free to be weird; the template only absorbs the winners. Never copy
client-specific code between client repos — promote or rewrite.
