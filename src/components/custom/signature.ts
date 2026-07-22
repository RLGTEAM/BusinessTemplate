/**
 * Per-client signature animation hook (docs/CREATIVE-CONTRACT.md).
 *
 * Called by src/lib/animation/index.ts INSIDE the template's
 * gsap.matchMedia("(prefers-reduced-motion: no-preference)") context, so:
 *   - reduced-motion users never run this code (page must look right without it);
 *   - tweens/ScrollTriggers created synchronously here are auto-reverted on
 *     page swap by mm.revert() — no manual bookkeeping needed;
 *   - Lenis smooth scroll + ScrollTrigger sync are already wired.
 *
 * Import gsap/ScrollTrigger directly (already bundled — this adds no weight).
 * Return a cleanup function ONLY for things GSAP doesn't track
 * (event listeners, observers, rAF loops); return undefined otherwise.
 *
 * The template ships this as a no-op.
 */
export function registerSignature(): (() => void) | undefined {
  return undefined;
}
