import { z } from "astro/zod";

/**
 * Single source of truth for one client site.
 *
 * - `data`    — factual business information (NAP, services, SEO). Feeds JSON-LD.
 * - `voice`   — tone + palette. `voice.palette` drives the Tailwind theme tokens.
 * - `content` — every piece of visible copy. A frozen core (nav/ui/consent/notFound/legal)
 *   is identical in every repo; the rest is reshaped per client to match the designed page.
 *
 * A schema failure fails the build (see src/content.config.ts and
 * scripts/validate-content.ts).
 */

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Expected a 6-digit hex color, e.g. #1a2b3c");

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM (24h)");

const urlOrEmpty = z.union([z.url(), z.literal("")]);

const link = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

export const businessSchema = z.object({
  locale: z.enum(["he", "en"]),

  /**
   * The one design decision that must be data (astro.config.mjs registers
   * fonts at build time): a self-hosted, Hebrew-capable font pairing.
   * Every other design decision — layout, composition, shape, rhythm,
   * color story — is made in code per client (docs/DESIGN-DOCTRINE.md).
   */
  design: z
    .object({
      /**
       * display font / body font — all 15 pairs support Hebrew + Latin.
       * classic (warm neutral, default) · modern (geometric) · elegant (literary serif) ·
       * warm (soft humanist) · bold (condensed impact) · editorial (magazine serif) ·
       * playful (rounded, friendly) · rounded (soft geometric display) ·
       * impact (humanist display) · poster (serif display) · refined (serif-sans) ·
       * techsans (technical/engineering) · serifnote (literary serif, wide weights) ·
       * retro (understated serif display) · handmade (handwritten display — headings only).
       */
      fontPairing: z
        .enum([
          "classic",
          "modern",
          "elegant",
          "warm",
          "bold",
          "editorial",
          "playful",
          "rounded",
          "impact",
          "poster",
          "refined",
          "techsans",
          "serifnote",
          "retro",
          "handmade",
        ])
        .default("classic"),
    })
    .default({ fontPairing: "classic" }),

  data: z.object({
    name: z.string().min(1),
    legalName: z.string().min(1),
    tagline: z.string(),
    contact: z.object({
      /** Display format, e.g. "050-123-4567". tel: href is derived in lib/business.ts */
      phone: z.string().min(1),
      email: z.email(),
      /** International digits only, e.g. "972501234567" (wa.me format). */
      whatsapp: z.string().regex(/^\d{8,15}$/),
      address: z.string().min(1),
      geo: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
    }),
    hours: z
      .array(
        z.object({
          /** Schema.org DayOfWeek — used for JSON-LD. */
          day: z.enum([
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ]),
          /** Display label in the site language, e.g. "ראשון". */
          label: z.string().min(1),
          open: time,
          close: time,
        }),
      )
      .min(1),
    services: z
      .array(
        z.object({
          slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
          title: z.string().min(1),
          description: z.string().min(1),
          /** Display string, e.g. "₪120" or "החל מ־₪250". Empty hides the price. */
          price: z.string(),
        }),
      )
      .min(1),
    socials: z.object({
      instagram: urlOrEmpty,
      facebook: urlOrEmpty,
      tiktok: urlOrEmpty,
    }),
    serviceAreas: z.array(z.string().min(1)),
    /** Schema.org priceRange for LocalBusiness, e.g. "₪₪". Empty omits it. */
    priceRange: z.string().default(""),
    /**
     * Analytics & tracking.
     * - cloudflareToken: cookieless Cloudflare Web Analytics — NO consent needed.
     * - gtagId / metaPixelId: cookie-based trackers. Setting either one makes the
     *   consent banner appear automatically, and the scripts load ONLY after the
     *   visitor accepts (stored choice in localStorage). Empty = nothing emitted.
     */
    analytics: z
      .object({
        cloudflareToken: z.string().default(""),
        /** Google tag id, e.g. "G-XXXXXXXXXX". */
        gtagId: z.string().default(""),
        /** Meta (Facebook) Pixel id, digits only. */
        metaPixelId: z.string().default(""),
      })
      .default({ cloudflareToken: "", gtagId: "", metaPixelId: "" }),
    seo: z.object({
      /** Canonical production origin, no trailing slash, e.g. "https://example.co.il". */
      siteUrl: z.url(),
      defaultTitle: z.string().min(1).max(70),
      defaultDescription: z.string().min(1).max(170),
      /** Filename inside public/, e.g. "og-default.png". */
      ogImage: z.string().min(1),
    }),
  }),

  voice: z.object({
    tone: z.string(),
    persona: z.string().min(1),
    formality: z.string(),
    keywords: z.array(z.string()),
    doNotSay: z.array(z.string()),
    ctaStyle: z.string(),
    palette: z.object({
      primary: hexColor,
      secondary: hexColor,
      accent: hexColor,
      /** Neutrals — optional; defaults reproduce the reference light theme.
       *  Set them for tinted or dark sites (dark is first-class: pick a dark
       *  surface + light ink and the validator checks the real combinations). */
      surface: hexColor.default("#faf9f7"),
      surfaceAlt: hexColor.default("#f1eeea"),
      ink: hexColor.default("#211c2e"),
      inkMuted: hexColor.default("#5d5670"),
      line: hexColor.default("#e2ddd6"),
      mood: z.string(),
    }),
  }),

  content: z.object({
    /* ────────────────────────────────────────────────────────────────────
     * FROZEN CORE — never remove or rename these fields; infrastructure
     * (Header nav, legal pages, 404, consent banner, skip link) and the
     * contract-driven smoke tests depend on them in every client repo.
     * ──────────────────────────────────────────────────────────────────── */
    nav: z.array(link).min(1),
    ui: z.object({
      skipToContent: z.string().min(1),
      openMenu: z.string().min(1),
      closeMenu: z.string().min(1),
    }),
    /** Cookie-consent banner strings. Rendered only when data.analytics declares
     *  a cookie-based tracker (gtagId / metaPixelId). */
    consent: z.object({
      message: z.string().min(1),
      acceptLabel: z.string().min(1),
      declineLabel: z.string().min(1),
      /** Link text to the privacy policy page. */
      privacyLabel: z.string().min(1),
    }),
    notFound: z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      backLabel: z.string().min(1),
    }),
    /**
     * Legal pages. The accessibility statement is legally required for Israeli
     * businesses (תקן 5568 / WCAG 2.2) — coordinator details must be real.
     */
    legal: z.object({
      accessibility: z.object({
        title: z.string().min(1),
        intro: z.array(z.string().min(1)).min(1),
        /** What the site implements (bullet list). */
        adjustments: z.array(z.string().min(1)).min(1),
        coordinator: z.object({
          name: z.string().min(1),
          phone: z.string().min(1),
          email: z.email(),
        }),
        /** ISO date, e.g. "2026-07-22". */
        statementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
      privacy: z.object({
        title: z.string().min(1),
        body: z.array(z.string().min(1)).min(1),
      }),
    }),

    /* ────────────────────────────────────────────────────────────────────
     * PER-CLIENT — the template ships NO content shapes here beyond two
     * optional canonical blocks. When building a client site, author the
     * content model to match the page you designed (schema first, then
     * JSON, then components via getBusiness()). Copy NEVER lives in
     * components.
     *
     * - `faq` is the canonical shape for FAQPage JSON-LD + llms.txt (AEO):
     *   include it whenever the business has real FAQs.
     * - `shell` exists ONLY for the template's unbuilt starter page —
     *   delete it (schema + JSON) when building the real site.
     * ──────────────────────────────────────────────────────────────────── */
    faq: z
      .object({
        title: z.string().optional(),
        items: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
      })
      .optional(),
    shell: z
      .object({
        headline: z.string().min(1),
        note: z.string().min(1),
        bidiSample: z.string().min(1),
      })
      .optional(),
  }),
});

export type Business = z.infer<typeof businessSchema>;
