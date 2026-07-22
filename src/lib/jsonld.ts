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
      addressCountry: business.locale === "he" ? "IL" : undefined,
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
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: telHref(data.contact.phone).replace("tel:", ""),
      url: whatsappHref(data.contact.whatsapp),
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

export function faqJsonLd(business: Business): JsonLd {
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
