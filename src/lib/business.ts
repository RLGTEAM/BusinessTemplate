import { getEntry } from "astro:content";
import type { Business } from "@/content/business.schema";

/**
 * Canonical accessor for the business entry. Use this in every component —
 * never import business.json directly.
 */
export async function getBusiness(): Promise<Business> {
  const entry = await getEntry("business", "site");
  if (!entry) {
    throw new Error("business.json entry not found — check src/content/business/business.json");
  }
  return entry.data;
}

/** "he" → dir="rtl"; anything else → "ltr". */
export function getDir(locale: Business["locale"]): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

/** "050-123-4567" → "tel:+972501234567" (Israeli numbers); keeps other formats digit-only. */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const e164 = digits.startsWith("0") ? `+972${digits.slice(1)}` : `+${digits}`;
  return `tel:${e164}`;
}

/** wa.me link from the digits-only whatsapp field. */
export function whatsappHref(whatsapp: string): string {
  return `https://wa.me/${whatsapp}`;
}

/**
 * Section links in business.json may use the sentinel "whatsapp" instead of a
 * URL — resolve it here so the number lives in exactly one place.
 */
export function resolveHref(href: string, business: Business): string {
  return href === "whatsapp" ? whatsappHref(business.data.contact.whatsapp) : href;
}
