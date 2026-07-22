import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { setupReveals } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

/**
 * Animation lifecycle. Wired once in BaseLayout.astro:
 *   astro:page-load  → initAnimations()
 *   astro:before-swap → destroyAnimations()
 *
 * Everything is created inside gsap.matchMedia() guarded by
 * prefers-reduced-motion, so reduced-motion users get a static page and
 * mm.revert() reliably kills every tween + ScrollTrigger between page swaps.
 */

let mm: gsap.MatchMedia | null = null;
let lenis: Lenis | null = null;
let rafCallback: ((time: number) => void) | null = null;

export function initAnimations(): void {
  destroyAnimations();

  mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    lenis = new Lenis({ autoRaf: false, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);

    rafCallback = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);

    setupReveals();

    return () => {
      if (rafCallback) {
        gsap.ticker.remove(rafCallback);
        rafCallback = null;
      }
      lenis?.destroy();
      lenis = null;
    };
  });
}

export function destroyAnimations(): void {
  // revert() runs the cleanup returned from mm.add() and reverts all
  // tweens/ScrollTriggers created inside it.
  mm?.revert();
  mm = null;
}
