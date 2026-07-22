// @ts-check
import { readFileSync } from "node:fs";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";

// business.json is the single source of truth — even the deploy URL comes from it.
const business = JSON.parse(
  readFileSync(new URL("./src/content/business/business.json", import.meta.url), "utf-8"),
);

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
      name: "Heebo",
      cssVariable: "--font-heebo",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["hebrew", "latin"],
      display: "swap",
      fallbacks: ["Arial", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Assistant",
      cssVariable: "--font-assistant",
      weights: [400, 600, 700],
      styles: ["normal"],
      subsets: ["hebrew", "latin"],
      display: "swap",
      fallbacks: ["Arial", "sans-serif"],
    },
  ],
});
