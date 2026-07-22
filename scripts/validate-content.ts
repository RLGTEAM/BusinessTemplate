/**
 * Standalone business.json validation (also enforced at build time via the
 * content collection schema). Run with: npm run validate:content
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { businessSchema } from "../src/content/business.schema";

const jsonPath = fileURLToPath(new URL("../src/content/business/business.json", import.meta.url));

const raw: unknown = JSON.parse(readFileSync(jsonPath, "utf-8").replace(/^﻿/, ""));
const result = businessSchema.safeParse(raw);

if (!result.success) {
  console.error("✗ business.json is invalid:\n");
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

console.log("✓ business.json is valid");
