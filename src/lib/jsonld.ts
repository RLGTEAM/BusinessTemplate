import type { Business } from "@/content/business.schema";
import { telHref, whatsappHref } from "./business";

/**
 * JSON-LD generators. All structured data derives from business.json.
 * Validate output at https://validator.schema.org after content changes.
 */

type JsonLd = Record<string, unknown>;

function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, `${siteUrl}/`).href;
}

export function localBusinessJsonLd(business: Business): JsonLd {
  const { data } = business;
  const sameAs = [data.socials.instagram, data.socials.facebook, data.socials.tiktok].filter(
    (url) => url !== "",
  );

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${data.seo.siteUrl}/#business`,
    name: data.name,
    legalName: data.legalName,
    description: data.seo.defaultDescription,
    url: data.seo.siteUrl,
    image: absoluteUrl(data.seo.siteUrl, data.seo.ogImage),
    telephone: telHref(data.contact.phone).replace("tel:", ""),
    email: data.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.contact.address,
      // The template is Israel-only by design (telHref assumes +972, the
      // legal content is scoped to ת"י 5568) — an English-locale build is
      // still the same Israeli business, so this is never locale-conditional.
      addressCountry: "IL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: data.contact.geo.lat,
      longitude: data.contact.geo.lng,
    },
    openingHoursSpecification: data.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${h.day}`,
      opens: h.open,
      closes: h.close,
    })),
    areaServed: data.serviceAreas.map((name) => ({ "@type": "City", name })),
    priceRange: data.priceRange !== "" ? data.priceRange : undefined,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: data.name,
      itemListElement: data.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.description,
        },
      })),
    },
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: telHref(data.contact.phone).replace("tel:", ""),
      // undefined keys drop out at JSON.stringify time (same as email above).
      url: data.contact.whatsapp ? whatsappHref(data.contact.whatsapp) : undefined,
    },
  };
}

export function organizationJsonLd(business: Business): JsonLd {
  const { data } = business;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${data.seo.siteUrl}/#organization`,
    name: data.name,
    legalName: data.legalName,
    url: data.seo.siteUrl,
    logo: absoluteUrl(data.seo.siteUrl, data.seo.ogImage),
    email: data.contact.email,
    telephone: telHref(data.contact.phone).replace("tel:", ""),
  };
}

export function websiteJsonLd(business: Business): JsonLd {
  const { data } = business;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${data.seo.siteUrl}/#website`,
    name: data.name,
    url: data.seo.siteUrl,
    inLanguage: business.locale,
    publisher: { "@id": `${data.seo.siteUrl}/#organization` },
  };
}

export function faqJsonLd(business: Business): JsonLd | null {
  if (!business.content.faq || business.content.faq.items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: business.content.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
