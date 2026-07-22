import type { APIRoute } from "astro";
import { getBusiness, telHref, whatsappHref } from "@/lib/business";

/**
 * llms.txt — emerging convention that gives AI answer engines a clean,
 * markdown summary of the site (https://llmstxt.org). Generated entirely
 * from business.json, so every client ships an accurate one for free.
 */
export const GET: APIRoute = async ({ site }) => {
  const business = await getBusiness();
  const { data, content } = business;

  const lines = [
    `# ${data.name}`,
    "",
    `> ${data.seo.defaultDescription}`,
    "",
    `- Website: ${site?.href ?? data.seo.siteUrl}`,
    `- Address: ${data.contact.address}`,
    `- Phone: ${telHref(data.contact.phone).replace("tel:", "")}`,
    `- WhatsApp: ${whatsappHref(data.contact.whatsapp)}`,
    `- Email: ${data.contact.email}`,
    `- Service areas: ${data.serviceAreas.join(", ")}`,
    "",
    "## Opening hours",
    "",
    ...data.hours.map((h) => `- ${h.day}: ${h.open}–${h.close}`),
    "",
    "## Services",
    "",
    ...data.services.map((s) => `- ${s.title}${s.price ? ` (${s.price})` : ""}: ${s.description}`),
    "",
    "## Frequently asked questions",
    "",
    ...content.faq.items.flatMap((item) => [`### ${item.question}`, "", item.answer, ""]),
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
