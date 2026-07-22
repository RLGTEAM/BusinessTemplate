import { z } from "astro/zod";

/**
 * Single source of truth for one client site.
 *
 * - `data`    — factual business information (NAP, services, SEO). Feeds JSON-LD.
 * - `voice`   — tone + palette. `voice.palette` drives the Tailwind theme tokens.
 * - `content` — every piece of visible copy, section by section. Components must
 *   not contain hardcoded business content; if a section needs a new string, it
 *   is added here first.
 *
 * A schema failure fails the build (see src/content.config.ts and
 * scripts/validate-content.ts).
 */

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Expected a 6-digit hex color, e.g. #1a2b3c");

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM (24h)");

const urlOrEmpty = z.union([z.url(), z.literal("")]);

/** Image reference: a filename inside src/assets/images/, e.g. "hero.svg". */
const imageRef = z.object({
  src: z.string().min(1),
  alt: z.string(),
});

const link = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

/** Middle-of-page sections whose order is configurable (header/hero/footer are fixed). */
export const orderableSections = [
  "services",
  "about",
  "testimonials",
  "gallery",
  "faq",
  "cta",
  "contact",
] as const;

export const businessSchema = z.object({
  locale: z.enum(["he", "en"]),

  /**
   * Design variants — the anti-sameness system. Each client site should use a
   * DIFFERENT combination so no two sites share a skeleton. All values are
   * validated; adding a new variant means: schema here → tokens/markup →
   * AGENTS.md. Defaults reproduce the original template look.
   */
  design: z
    .object({
      /** display font / body font — all pairs support Hebrew + Latin. */
      fontPairing: z
        .enum(["classic", "modern", "elegant", "warm", "bold", "editorial"])
        .default("classic"),
      hero: z.enum(["split", "centered", "full-bleed"]).default("split"),
      shape: z.enum(["rounded", "sharp", "pill"]).default("rounded"),
      /** Vertical rhythm of sections. */
      density: z.enum(["airy", "regular", "compact"]).default("regular"),
      servicesLayout: z.enum(["cards", "list", "panels"]).default("cards"),
      galleryLayout: z.enum(["grid", "masonry", "featured"]).default("grid"),
      sectionOrder: z
        .array(z.enum(orderableSections))
        .default([...orderableSections])
        .refine(
          (order) =>
            order.length === orderableSections.length &&
            orderableSections.every((s) => order.includes(s)),
          "sectionOrder must contain every section exactly once",
        ),
    })
    .default({
      fontPairing: "classic",
      hero: "split",
      shape: "rounded",
      density: "regular",
      servicesLayout: "cards",
      galleryLayout: "grid",
      sectionOrder: [...orderableSections],
    }),

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
    /** Cloudflare Web Analytics (cookieless, no consent banner needed).
     *  Empty token = no analytics script emitted. Dashboard → Analytics → Web Analytics. */
    analytics: z
      .object({
        cloudflareToken: z.string().default(""),
      })
      .default({ cloudflareToken: "" }),
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
    persona: z.string(),
    formality: z.string(),
    keywords: z.array(z.string()),
    doNotSay: z.array(z.string()),
    ctaStyle: z.string(),
    palette: z.object({
      primary: hexColor,
      secondary: hexColor,
      accent: hexColor,
      mood: z.string(),
    }),
  }),

  content: z.object({
    nav: z.array(link).min(1),
    hero: z.object({
      eyebrow: z.string(),
      headline: z.string().min(1),
      subheadline: z.string(),
      primaryCta: link,
      secondaryCta: link.optional(),
      image: imageRef,
    }),
    services: z.object({
      title: z.string().min(1),
      subtitle: z.string(),
    }),
    about: z.object({
      title: z.string().min(1),
      subtitle: z.string(),
      /** Paragraphs. */
      body: z.array(z.string().min(1)).min(1),
      highlights: z.array(
        z.object({
          value: z.string().min(1),
          label: z.string().min(1),
        }),
      ),
      image: imageRef,
    }),
    testimonials: z.object({
      title: z.string().min(1),
      subtitle: z.string(),
      items: z
        .array(
          z.object({
            quote: z.string().min(1),
            author: z.string().min(1),
            role: z.string(),
          }),
        )
        .min(1),
    }),
    gallery: z.object({
      title: z.string().min(1),
      subtitle: z.string(),
      items: z.array(imageRef).min(1),
    }),
    faq: z.object({
      title: z.string().min(1),
      subtitle: z.string(),
      items: z
        .array(
          z.object({
            question: z.string().min(1),
            answer: z.string().min(1),
          }),
        )
        .min(1),
    }),
    cta: z.object({
      title: z.string().min(1),
      subtitle: z.string(),
      button: link,
    }),
    contactForm: z.object({
      title: z.string().min(1),
      subtitle: z.string(),
      nameLabel: z.string().min(1),
      emailLabel: z.string().min(1),
      phoneLabel: z.string().min(1),
      messageLabel: z.string().min(1),
      submitLabel: z.string().min(1),
      sendingLabel: z.string().min(1),
      successMessage: z.string().min(1),
      errorMessage: z.string().min(1),
      requiredError: z.string().min(1),
      emailError: z.string().min(1),
    }),
    footer: z.object({
      rights: z.string().min(1),
      contactTitle: z.string().min(1),
      hoursTitle: z.string().min(1),
      navTitle: z.string().min(1),
      areasTitle: z.string().min(1),
    }),
    ui: z.object({
      skipToContent: z.string().min(1),
      openMenu: z.string().min(1),
      closeMenu: z.string().min(1),
    }),
  }),
});

export type Business = z.infer<typeof businessSchema>;
