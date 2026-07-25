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
 * the duplicate set is marked aria-hidden="true" (and stripped of any `id`
 * attributes, to avoid duplicate DOM ids) so screen readers never read the
 * content twice and duplicated ids never collide. Duplication is guarded by
 * a data attribute, so calling marquee() again on an already-duplicated el
 * (a stray re-init) skips duplication — Astro page swaps give a fresh DOM
 * anyway, but the guard costs nothing and keeps the function idempotent.
 *
 * marquee() layout precondition: el must already lay out as a single
 * non-wrapping row — e.g. `flex w-max flex-nowrap`, or `whitespace-nowrap`
 * with inline children — inside an ancestor viewport with `overflow-hidden`.
 * With default block layout (children wrap/stack instead of running past
 * el's width), el.scrollWidth never exceeds its parent's clientWidth even
 * after duplication, so there's nothing to translate past — the tween would
 * just sit still or jitter. marquee() checks for this after duplicating
 * (against el.parentElement's clientWidth, not el's own — a shrink-to-fit
 * `el` is always exactly as wide as its content, so el's own clientWidth
 * can never usefully signal overflow; the ancestor viewport is what
 * actually clips it) and, if nothing overflows, console.warns once and
 * skips the tween rather than animating a no-op.
 */

function dirFactor(): number {
  // xPercent is a physical (viewport-relative) transform, not a logical one
  // — it does not auto-flip for RTL. Left uncorrected, a single hardcoded
  // sign would scroll the ticker toward a different edge (relative to
  // reading direction) depending on dir. Returning ltr -> 1 / rtl -> -1
  // means the DEFAULT (reverse: false) ticker always scrolls in the same
  // logical direction — toward the inline-start edge — in both LTR and RTL,
  // even though that's the opposite physical (left vs. right) direction in
  // each case; opts.reverse negates this again for a ticker that should run
  // the other way.
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
      duplicate.removeAttribute("id");
      for (const nestedIdEl of duplicate.querySelectorAll<HTMLElement>("[id]")) {
        nestedIdEl.removeAttribute("id");
      }
      el.append(duplicate);
    }
    el.dataset.marqueeDuplicated = "true";
  }

  // el must lay out as a single non-wrapping row (see the doc comment
  // above), typically shrink-to-fit (e.g. `w-max`) so it can be wider than
  // its own parent — which means el's children can never overflow EL's OWN
  // clientWidth (a shrink-to-fit box is, by definition, always exactly as
  // wide as its content). The actual clipping viewport is el's parent, so
  // that's what "does the duplicated content overflow" has to be checked
  // against; falling back to el.clientWidth only if el is unparented. If
  // nothing overflows, there's nothing to loop — warn once (not on every
  // re-init) and bail instead of animating a no-op.
  const viewportWidth = el.parentElement?.clientWidth ?? el.clientWidth;
  if (el.scrollWidth <= viewportWidth) {
    if (el.dataset.marqueeWarned !== "true") {
      console.warn(
        "[animation/helpers] marquee(): duplicated content doesn't overflow its viewport after duplication — nothing to loop. el must lay out as a single non-wrapping row (e.g. flex w-max flex-nowrap, or whitespace-nowrap inline children) inside an overflow-hidden viewport.",
        el,
      );
      el.dataset.marqueeWarned = "true";
    }
    return;
  }

  // el's own box is now the doubled (duplicated) width, and xPercent
  // resolves against that box — so the seam where the duplicate set lines
  // up exactly with the original is at 50%/-50% of el's width, not 100%
  // (100% would translate a full extra original-width past the seam into
  // blank space). distance is the ORIGINAL content's width (half of the
  // now-doubled el.scrollWidth), so duration = distance / speed still means
  // ~pixels/second of the original content: the tween's actual pixel travel
  // is 50% of el's doubled width, which equals one original-content width.
  const distance = el.scrollWidth / 2;

  const endXPercent = -50 * dirFactor() * (reverse ? -1 : 1);

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
