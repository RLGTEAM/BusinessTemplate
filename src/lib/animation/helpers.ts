import { gsap } from "gsap";

/**
 * "Aliveness" motion primitives: marquee / parallax / counter.
 *
 * These are plumbing, not design decisions — headless, no markup, no design
 * opinions (same category as form.ts/reveal.ts). Call them ONLY from
 * registerCustomAnimations() in src/lib/animation/custom.ts, which already
 * runs inside the template's
 * gsap.matchMedia("(prefers-reduced-motion: no-preference)") context:
 *
 *   - reduced-motion users never execute this code at all, so the markup's
 *     resting state must already be correct (see "still frame" below);
 *   - every tween/ScrollTrigger created in here is synchronous, so the
 *     lifecycle's mm.revert() (astro:before-swap) tears it all down
 *     automatically. That's why none of these functions start an rAF loop or
 *     attach a listener/observer that would outlive the call — if a job
 *     seems to need one, let gsap own the loop instead (see index.ts).
 *
 * Still-frame rule: the server-rendered markup must already show the FINAL
 * state, because reduced-motion and no-JS visitors only ever see it as-is:
 *   - counter(): el.textContent must already read as the final formatted
 *     number before this runs — counter() only re-animates a value that was
 *     already correct at rest.
 *   - marquee(): el's children, before duplication, must already read as the
 *     complete, correctly-ordered content.
 *
 * RTL: counter() writes numerals via el.textContent — wrap the element in
 * `.force-ltr` in the caller's markup (AGENTS.md's RTL rules); this module
 * never touches classes itself.
 *
 * marquee() duplicates el's children exactly once to build a seamless loop;
 * the duplicate set is marked aria-hidden="true" so screen readers never
 * read the content twice. Duplication is guarded by a data attribute, so
 * calling marquee() again on an already-duplicated el (a stray re-init) skips
 * duplication — Astro page swaps give a fresh DOM anyway, but the guard costs
 * nothing and keeps the function idempotent.
 */

function dirFactor(): number {
  // Same dir-detection convention as reveal.ts's inlineStartFactor(): read
  // document.documentElement.dir directly (not exported from reveal.ts, so
  // replicated here rather than imported).
  return document.documentElement.dir === "rtl" ? -1 : 1;
}

export function marquee(el: HTMLElement, opts?: { speed?: number; reverse?: boolean }): void {
  const speed = opts?.speed ?? 40;
  const reverse = opts?.reverse ?? false;

  if (el.dataset.marqueeDuplicated !== "true") {
    const originalChildren = Array.from(el.querySelectorAll<HTMLElement>(":scope > *"));
    for (const child of originalChildren) {
      const duplicate = child.cloneNode(true) as HTMLElement;
      duplicate.setAttribute("aria-hidden", "true");
      el.append(duplicate);
    }
    el.dataset.marqueeDuplicated = "true";
  }

  // Distance covers the full (now-duplicated) content; since the duplicate
  // set is identical to the original, translating by a multiple of the
  // original width always looks seamless at the loop point.
  const distance = el.scrollWidth;
  if (distance === 0) {
    return;
  }

  const endXPercent = -100 * dirFactor() * (reverse ? -1 : 1);

  gsap.fromTo(
    el,
    { xPercent: 0 },
    {
      xPercent: endXPercent,
      duration: distance / speed,
      ease: "none",
      repeat: -1,
    },
  );
}

export function parallax(el: HTMLElement, opts?: { speed?: number }): void {
  const speed = opts?.speed ?? 0.2;

  gsap.to(el, {
    yPercent: -100 * speed,
    ease: "none",
    scrollTrigger: {
      trigger: el,
      scrub: true,
      start: "top bottom",
      end: "bottom top",
    },
  });
}

export function counter(el: HTMLElement, opts?: { duration?: number }): void {
  const duration = opts?.duration ?? 1.6;
  const target = Number.parseFloat(el.dataset.counterTarget ?? "");

  if (Number.isNaN(target)) {
    console.warn("[animation/helpers] counter(): el.dataset.counterTarget is not a number", el);
    return;
  }

  const formatter = new Intl.NumberFormat(document.documentElement.lang);
  const state = { value: 0 };

  gsap.to(state, {
    value: target,
    duration,
    ease: "power1.out",
    scrollTrigger: { trigger: el, start: "top 85%", once: true },
    onUpdate: () => {
      el.textContent = formatter.format(Math.round(state.value));
    },
    onComplete: () => {
      // Final frame writes the exact formatted target, independent of any
      // rounding/float drift from the tweened value.
      el.textContent = formatter.format(target);
    },
  });
}
