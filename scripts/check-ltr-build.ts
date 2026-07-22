/**
 * Structural check for the LTR/English path: temporarily builds the site with
 * locale "en" and asserts the output flips lang/dir correctly, then restores
 * business.json. Run with: npm run test:ltr-build (also runs in CI).
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const jsonPath = fileURLToPath(new URL("../src/content/business/business.json", import.meta.url));
const distIndex = fileURLToPath(new URL("../dist/index.html", import.meta.url));

const original = readFileSync(jsonPath, "utf-8");

try {
  const patched = JSON.parse(original.replace(/^﻿/, "")) as { locale: string };
  patched.locale = "en";
  writeFileSync(jsonPath, JSON.stringify(patched, null, 2));

  execSync("npx astro build", { stdio: "inherit" });

  const html = readFileSync(distIndex, "utf-8");
  const checks: Array<[string, boolean]> = [
    ['lang="en"', html.includes('lang="en"')],
    ['dir="ltr"', html.includes('dir="ltr"')],
    ["no dir=rtl leftover", !html.includes('dir="rtl"')],
    ["og:locale en_US", html.includes('content="en_US"')],
  ];
  const failed = checks.filter(([, ok]) => !ok);
  for (const [label, ok] of checks) {
    console.log(`${ok ? "✓" : "✗"} ${label}`);
  }
  if (failed.length > 0) {
    process.exit(1);
  }
  console.log("✓ LTR/English build is structurally correct");
} finally {
  writeFileSync(jsonPath, original);
  // Rebuild so dist/ matches the real locale again (cheap, keeps local state sane).
  execSync("npx astro build", { stdio: "ignore" });
}
