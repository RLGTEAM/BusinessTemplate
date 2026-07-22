import { gsap } from "gsap";

/**
 * Scroll-reveal conventions (the one canonical way to animate content in):
 *
 *   data-reveal              fade + rise
 *   data-reveal="slide-start" fade + slide in from the inline-start edge (RTL-aware)
 *   data-reveal="slide-end"   fade + slide in from the inline-end edge (RTL-aware)
 *   data-reveal="scale"       fade + subtle scale-up
 *   data-reveal-group        stagger direct children with fade + rise
 *
 * Elements are fully visible without JS; gsap.from() only hides them once the
 * animation is actually going to run. Transforms/opacity only — never animate
 * layout properties.
 */

const EASE = "power2.out";
const START = "top 85%";

function inlineStartFactor(): number {
  // translateX does not auto-flip in RTL — mirror it here.
  return document.documentElement.dir === "rtl" ? 1 : -1;
}

function variant(kind: string): gsap.TweenVars {
  switch (kind) {
    case "slide-start":
      return { x: 48 * inlineStartFactor() };
    case "slide-end":
      return { x: -48 * inlineStartFactor() };
    case "scale":
      return { scale: 0.94 };
    default:
      return { y: 28 };
  }
}

export function setupReveals(): void {
  for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
    gsap.from(el, {
      ...variant(el.dataset.reveal ?? ""),
      opacity: 0,
      duration: 0.8,
      ease: EASE,
      scrollTrigger: { trigger: el, start: START },
    });
  }

  for (const group of document.querySelectorAll<HTMLElement>("[data-reveal-group]")) {
    gsap.from(group.children, {
      y: 28,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: EASE,
      scrollTrigger: { trigger: group, start: START },
    });
  }
}
