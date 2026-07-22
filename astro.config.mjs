// @ts-check
import { readFileSync } from "node:fs";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";

// business.json is the single source of truth — even the deploy URL comes from it.
const business = JSON.parse(
  readFileSync(new URL("./src/content/business/business.json", import.meta.url), "utf-8"),
);

// design.fontPairing → actual families (all support Hebrew + Latin).
// Registered under fixed cssVariables so components/CSS never change per client.
const FONT_PAIRINGS = {
  classic: { display: "Assistant", body: "Heebo" },
  modern: { display: "Rubik", body: "Assistant" },
  elegant: { display: "Frank Ruhl Libre", body: "Heebo" },
  warm: { display: "Alef", body: "Rubik" },
  bold: { display: "Karantina", body: "Heebo" },
  editorial: { display: "David Libre", body: "Assistant" },
};
const pairing = FONT_PAIRINGS[business.design?.fontPairing ?? "classic"];

export default defineConfig({
  site: business.data.seo.siteUrl,
  output: "static",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      PUBLIC_WEB3FORMS_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
        default: "",
      }),
    },
  },
  fonts: [
    {
      // Downloaded at build time and served from this origin (self-hosted).
      provider: fontProviders.google(),
      name: pairing.display,
      cssVariable: "--font-brand-display",
      weights: [400, 700],
      styles: ["normal"],
      subsets: ["hebrew", "latin"],
      display: "swap",
      fallbacks: ["Arial", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: pairing.body,
      cssVariable: "--font-brand-body",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["hebrew", "latin"],
      display: "swap",
      fallbacks: ["Arial", "sans-serif"],
    },
  ],
});
