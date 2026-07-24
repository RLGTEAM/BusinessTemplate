# Recipes — patterns, not components

Every prebuilt section was deleted (`docs/superpowers/specs/2026-07-24-primitives-only-design.md`).
There is nothing to gut or reskin — you build every component from zero, per
client. These six recipes are the RTL/a11y-correct patterns worth not
re-deriving from scratch each time. Each is a **minimal snippet plus the rules
that make it correct** — deliberately incomplete, never a paste-able
component. Consult `docs/DESIGN-DOCTRINE.md` for the floor and page contract
these patterns exist to satisfy.

## 1. Section skeleton

Why: every section must satisfy the page contract (nav ids resolve, decor
never covers content, entrances respect reduced motion) regardless of what
you design inside it.

```astro
<section id="services" class="relative isolate scroll-mt-20 section-pad">
  {/* decorative layer, if any, goes here first: aria-hidden + -z-10 */}
  <div data-reveal>
    <!-- content -->
  </div>
</section>
```

Rules:

- `id` must equal the `#fragment` of the matching `content.nav` href, exactly.
- `scroll-mt-20` — the sticky header eats space above the anchor otherwise.
- `section-pad` utility for vertical rhythm — never a literal `py-*` on a
  `<section>` (it reads `--section-py`, overridden per client in `custom.css`).
- `relative isolate` on the section root if it has any decorative/background
  layer — that layer sits at `-z-10` between the background and the content,
  never `position: absolute` floating loose.
- `data-reveal` (or `data-reveal-group` for a list of children) on the content
  you want animated in — never a bespoke GSAP instance per section.

## 2. Accessible mobile nav

Why: a disclosure pattern that's keyboard-operable and doesn't leave
screen-reader users guessing at open/closed state. Distilled from the
pre-deletion `Header.astro` (`git show a8e87ba:src/components/sections/Header.astro`).

```astro
<button
  type="button"
  id="menu-toggle"
  aria-expanded="false"
  aria-controls="mobile-menu"
  aria-label={content.ui.openMenu}
  data-open-label={content.ui.openMenu}
  data-close-label={content.ui.closeMenu}
>
  <!-- icon -->
</button>

<div id="mobile-menu" hidden>
  <!-- nav links -->
</div>

<script>
  function setupMobileNav(): void {
    const toggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("mobile-menu");
    if (!(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) return;

    const setOpen = (open: boolean): void => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", (open ? toggle.dataset.closeLabel : toggle.dataset.openLabel) ?? "");
      menu.hidden = !open;
    };

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    for (const link of menu.querySelectorAll("a")) link.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  document.addEventListener("astro:page-load", setupMobileNav);
</script>
```

Rules:

- `aria-expanded` + `aria-controls` on the button; `hidden` (not just a CSS
  class) on the panel when closed.
- Labels come from `content.ui.openMenu` / `content.ui.closeMenu` — never
  hardcode "פתח תפריט"/"Menu". Swap the `aria-label` on toggle so it always
  announces the NEXT action, not the current state.
- Escape closes the menu and returns focus to the toggle. Clicking any link
  inside closes it too.
- Binding lives in a named `setup*()` registered on `astro:page-load` (never
  bare top-level script code — it must survive Astro's page swaps).

## 3. Contact form (headless contract)

Why: `src/lib/form.ts` ships tested validation/submission logic and expects
an exact markup contract — quote it, don't reinvent it. **Forms are
OPTIONAL.** A phone link and a WhatsApp link (`whatsappHref()`) are a complete
contact path on their own; only build a form if the client actually wants
one.

Contract, verbatim from `src/lib/form.ts`'s doc comment:

> `<form data-contact-form>` with `data-{sending-label,submit-label,
> success-message,error-message,required-error,email-error,subject}`;
> required fields have an `id` and an error element with id `${id}-error`; a
> `[data-form-status]` element with `role="status"` `aria-live="polite"`;
> optional honeypot input `name="botcheck"`.

Minimal shape:

```astro
<form
  data-contact-form
  data-sending-label={copy.sendingLabel}
  data-submit-label={copy.submitLabel}
  data-success-message={copy.successMessage}
  data-error-message={copy.errorMessage}
  data-required-error={copy.requiredError}
  data-email-error={copy.emailError}
  data-subject={`${copy.title} — ${business.data.name}`}
  novalidate
>
  <input type="checkbox" name="botcheck" tabindex="-1" aria-hidden="true" class="pointer-events-none absolute size-px opacity-0" />

  <label for="email">{copy.emailLabel}</label>
  <input id="email" name="email" type="email" dir="ltr" required aria-describedby="email-error" />
  <p id="email-error" data-field-error hidden></p>

  <button type="submit">{copy.submitLabel}</button>
  <p data-form-status role="status" aria-live="polite" hidden></p>
</form>
```

Rules:

- Every string is `data-*` from client-authored content (a form section you
  add to the schema yourself — there is no canonical `content.contactForm`
  shape shipped) — never a literal in the markup or the script.
- The honeypot input is unlabeled, `tabindex="-1"`, `aria-hidden="true"`, and
  visually hidden but still in the DOM (not `display:none` on the field
  itself — bots that skip hidden fields must still see it as fillable).
- `${id}-error` must match the field's `id` exactly; `form.ts` looks it up by
  string concatenation.
- Style `[data-state="success"]` / `[data-state="error"]` on the
  `[data-form-status]` element yourself — `form.ts` only sets the attribute
  and the text, never a class or color.
- No wiring needed beyond markup: `setupContactForms()` binds automatically
  to every `form[data-contact-form]` on `astro:page-load` (already called
  once in `BaseLayout`).
- `.env` needs `PUBLIC_WEB3FORMS_KEY` (copy `.env.example`) — created from a
  free Web3Forms key using the CLIENT's email, so submissions land in their
  inbox. Without it, submission surfaces the error state instead of a silent
  no-op.

## 4. RTL survival kit

Why: the properties that DON'T auto-flip under `dir="rtl"`, and the two
markup patterns for mixed-direction text. Distilled from the pre-deletion
`ContactForm.astro` and `Footer.astro`.

- Logical utilities only: `ms-* me-* ps-* pe-* start-* end-* text-start
  inset-inline-*`. Never `ml/mr/pl/pr/left-/right-/text-left/text-right`.
- `<bdi>` around any run that mixes Hebrew with Latin/numbers so bidi
  reordering can't scramble it — business names, addresses, "© {year}
  {legalName}".
- `class="force-ltr"` on phone numbers, prices, emails, times — text that must
  read left-to-right even inside an RTL page. Combine with `<bdi>` when the
  surrounding sentence is Hebrew: `<bdi class="force-ltr">{phone}</bdi>`.
- `dir="ltr"` directly on `<input type="email">` / `<input type="tel">` — the
  cursor and placeholder must behave LTR regardless of page direction (text
  inputs stay unset/default).
- X-offsets that don't auto-flip (box-shadow, `translateX`) multiply by
  `var(--dir-factor)`; gradients use `var(--angle-brand)`; `transform-origin`
  reads `var(--origin-inline-start)`; `background-position` reads
  `var(--bg-pos-inline-start)`. GSAP x-slides go through
  `src/lib/animation/reveal.ts`, which already mirrors — don't hand-roll a
  parallel path.
- Never `tracking-*`/`letter-spacing` on Hebrew text (global.css guards this;
  don't fight it with an inline style).

## 5. Images

Why: `business.json` references images by filename; `resolveImage()` is the
only bridge to the optimized asset Astro needs at build time.

```astro
---
import { Image } from "astro:assets";
import { resolveImage } from "@/lib/images";
---

<Image
  src={resolveImage(item.src)}
  alt={item.alt}
  widths={[320, 640]}
  sizes="(max-width: 767px) 50vw, 33vw"
  loading="lazy"
  class="aspect-square w-full rounded-card object-cover"
/>
```

Rules:

- Files live in `src/assets/images/`; `business.json` stores only the
  filename (`resolveImage()` throws with the list of available files if it
  doesn't match).
- Always pass explicit `widths`/`sizes` (or `width`/`height`) — an
  unconstrained `<Image>` is a CLS and LCP risk.
- `alt` is client-authored copy from `business.json`, never a literal.
- The hero/LCP image should skip `loading="lazy"` (it needs to paint
  immediately); everything below the fold should keep it.

## 6. Footer with legal links

Why: the page contract requires a `body > footer` reaching both mandatory
legal pages, plus NAP rendered with the RTL rules above. Distilled from the
pre-deletion `Footer.astro`.

```astro
<footer>
  <p><bdi>{data.legalName}</bdi> © <bdi class="force-ltr">{new Date().getFullYear()}</bdi></p>

  <ul>
    {data.hours.map((entry) => (
      <li>
        <span>{entry.label}</span>
        <bdi class="force-ltr tabular-nums">{entry.open}–{entry.close}</bdi>
      </li>
    ))}
  </ul>

  <a href={telHref(data.contact.phone)}><bdi class="force-ltr">{data.contact.phone}</bdi></a>
  <a href={`mailto:${data.contact.email}`}><bdi class="force-ltr">{data.contact.email}</bdi></a>

  <ul>
    <li><a href="/accessibility-statement/">{content.legal.accessibility.title}</a></li>
    <li><a href="/privacy/">{content.legal.privacy.title}</a></li>
  </ul>
</footer>
```

Rules:

- Both legal links are mandatory, exact hrefs: `/accessibility-statement/`
  and `/privacy/`. Their link text comes from `content.legal.*.title`.
- Business/legal names get `<bdi>`; phone, email, hours get `force-ltr`
  (stack both on a value embedded in an otherwise-Hebrew sentence).
- Hours render from `data.hours` (one entry per day) — don't hardcode a
  day list; a client with different hours per day shouldn't need a code
  change.
- `telHref()` / `whatsappHref()` from `src/lib/business.ts` build the href —
  never hand-format a `tel:`/`wa.me` URL.
