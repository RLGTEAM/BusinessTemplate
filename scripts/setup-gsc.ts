/**
 * Google Search Console setup for a deployed production site.
 *
 *   npm run gsc:setup            # verify domain (Cloudflare DNS TXT) → add property → submit sitemap
 *   npm run gsc:setup -- --auth  # one-time: mint the Google OAuth refresh token (browser flow)
 *   npm run gsc:setup -- --dry-run
 *
 * Requires in .env (or shell env):
 *   GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET  — a "Desktop app" OAuth
 *     client from any Google Cloud project with the Search Console API and the
 *     Site Verification API enabled (one client serves every client site).
 *   GOOGLE_OAUTH_REFRESH_TOKEN — minted once per Google account via --auth.
 *   CLOUDFLARE_API_TOKEN — must carry Zone:Read + DNS:Edit for the client's zone
 *     (the Pages-only deploy token is NOT enough; make one token with both).
 *
 * The domain property (sc-domain:example.co.il) is used, so verification is a
 * DNS TXT record on the zone apex and covers www/apex/http/https at once.
 * Everything is idempotent: existing TXT records, an already-verified domain,
 * an already-added property, and a resubmitted sitemap are all fine.
 */

import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { businessSchema } from "../src/content/business.schema";

const jsonPath = fileURLToPath(new URL("../src/content/business/business.json", import.meta.url));
const envPath = fileURLToPath(new URL("../.env", import.meta.url));

const args = process.argv.slice(2);
const hasFlag = (name: string) => args.includes(`--${name}`);
const dryRun = hasFlag("dry-run");

const fail: (message: string) => never = (message) => {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
};

/** Minimal .env reader — same contract as scripts/deploy.ts. */
function fromEnvFile(key: string): string | undefined {
  if (!existsSync(envPath)) return undefined;
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match?.[1] === key) {
      return (match[2] ?? "").trim().replace(/^["']|["']$/g, "") || undefined;
    }
  }
  return undefined;
}

const env = (key: string): string | undefined => process.env[key] || fromEnvFile(key);
const requireEnv = (key: string): string =>
  env(key) ?? fail(`${key} is missing — see the header of scripts/setup-gsc.ts`);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

async function api(
  url: string,
  init: RequestInit,
  what: string,
  okStatuses: readonly number[] = [200],
): Promise<Record<string, unknown>> {
  const res = await fetch(url, init);
  const body: unknown = await res.json().catch(() => ({}));
  if (!okStatuses.includes(res.status)) {
    fail(`${what} failed (HTTP ${res.status}): ${JSON.stringify(body).slice(0, 400)}`);
  }
  return isRecord(body) ? body : {};
}

// ---------------------------------------------------------------- OAuth

const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/siteverification",
  "https://www.googleapis.com/auth/webmasters",
].join(" ");

/** --auth: loopback flow. Prints the refresh token to put in .env. */
async function mintRefreshToken(clientId: string, clientSecret: string): Promise<never> {
  const port = 53682;
  const redirect = `http://127.0.0.1:${port}/`;
  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirect)}` +
    `&response_type=code&access_type=offline&prompt=consent&scope=${encodeURIComponent(OAUTH_SCOPES)}`;

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const got = new URL(req.url ?? "/", redirect).searchParams.get("code");
      res.end("Search Console auth captured — you can close this tab.");
      if (got) {
        server.close();
        resolve(got);
      }
    });
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      console.log("\nOpen this URL in a browser logged into the STUDIO's Google account:\n");
      console.log(`${authUrl}\n`);
    });
  });

  const token = await api(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirect,
        grant_type: "authorization_code",
      }),
    },
    "OAuth code exchange",
  );
  const refresh = token.refresh_token;
  if (typeof refresh !== "string") fail("Google returned no refresh_token — retry --auth.");
  console.log("Add this line to .env (never commit it):\n");
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${refresh}\n`);
  process.exit(0);
}

async function accessToken(
  clientId: string,
  clientSecret: string,
  refresh: string,
): Promise<string> {
  const token = await api(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh,
        grant_type: "refresh_token",
      }),
    },
    "OAuth token refresh",
  );
  const access = token.access_token;
  if (typeof access !== "string") fail("token refresh returned no access_token");
  return access;
}

// ---------------------------------------------------------------- Cloudflare DNS

interface Zone {
  id: string;
  name: string;
}

/** www.cafe.example.co.il → try cafe.example.co.il, example.co.il, co.il until a zone matches. */
async function findZone(cfToken: string, hostname: string): Promise<Zone> {
  const labels = hostname.replace(/^www\./, "").split(".");
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join(".");
    const body = await api(
      `https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(candidate)}`,
      { headers: { authorization: `Bearer ${cfToken}` } },
      "Cloudflare zone lookup",
    );
    const first = Array.isArray(body.result) ? body.result[0] : undefined;
    if (isRecord(first) && typeof first.id === "string" && typeof first.name === "string") {
      return { id: first.id, name: first.name };
    }
  }
  fail(`no Cloudflare zone found for ${hostname} — is the domain on this Cloudflare account?`);
}

async function ensureTxtRecord(cfToken: string, zone: Zone, content: string): Promise<void> {
  const headers = { authorization: `Bearer ${cfToken}`, "content-type": "application/json" };
  const existing = await api(
    `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?type=TXT&name=${encodeURIComponent(zone.name)}`,
    { headers },
    "Cloudflare DNS record lookup",
  );
  const records = Array.isArray(existing.result) ? existing.result : [];
  if (
    records.some((r) => isRecord(r) && typeof r.content === "string" && r.content.includes(content))
  ) {
    console.log("✓ verification TXT record already present");
    return;
  }
  if (dryRun) {
    console.log(`[dry-run] would create TXT @ ${zone.name}: ${content}`);
    return;
  }
  await api(
    `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "TXT", name: zone.name, content, ttl: 300 }),
    },
    "Cloudflare TXT record creation",
  );
  console.log("✓ verification TXT record created");
}

// ---------------------------------------------------------------- Google APIs

async function verifyDomain(google: Record<string, string>, domain: string): Promise<void> {
  const site = { site: { type: "INET_DOMAIN", identifier: domain } };
  const tokenBody = await api(
    "https://www.googleapis.com/siteVerification/v1/token",
    {
      method: "POST",
      headers: google,
      body: JSON.stringify({ ...site, verificationMethod: "DNS_TXT" }),
    },
    "site-verification token request",
  );
  const txt = tokenBody.token;
  if (typeof txt !== "string") fail("Google returned no verification token");

  const cfToken = requireEnv("CLOUDFLARE_API_TOKEN");
  const zone = await findZone(cfToken, domain);
  if (zone.name !== domain) {
    fail(
      `domain property must be the zone apex: use sc-domain:${zone.name} (siteUrl points at ${domain})`,
    );
  }
  await ensureTxtRecord(cfToken, zone, txt);
  if (dryRun) {
    console.log("[dry-run] would poll Google verification, add the property, submit the sitemap");
    process.exit(0);
  }

  // DNS propagation: poll up to ~6 minutes with 20s spacing.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(
      "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=DNS_TXT",
      { method: "POST", headers: google, body: JSON.stringify(site) },
    );
    if (res.ok) {
      console.log("✓ domain ownership verified with Google");
      return;
    }
    if (attempt >= 18) {
      const body = await res.text();
      fail(`verification did not succeed after ${attempt} attempts: ${body.slice(0, 300)}`);
    }
    console.log(`… DNS not visible to Google yet (attempt ${attempt}/18), retrying in 20s`);
    await new Promise((r) => setTimeout(r, 20_000));
  }
}

async function main(): Promise<void> {
  const clientId = requireEnv("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_OAUTH_CLIENT_SECRET");
  if (hasFlag("auth")) await mintRefreshToken(clientId, clientSecret);

  const parsed = businessSchema.safeParse(
    JSON.parse(readFileSync(jsonPath, "utf-8").replace(/^﻿/, "")) as unknown,
  );
  if (!parsed.success) fail("business.json is invalid — run `npm run validate:content` first.");
  const siteUrl = new URL(parsed.data.data.seo.siteUrl);
  const domain = siteUrl.hostname.replace(/^www\./, "");
  if (domain === "example.com")
    fail("data.seo.siteUrl is still the placeholder — set the real domain first.");

  const access = await accessToken(
    clientId,
    clientSecret,
    requireEnv("GOOGLE_OAUTH_REFRESH_TOKEN"),
  );
  const google = { authorization: `Bearer ${access}`, "content-type": "application/json" };
  const property = `sc-domain:${domain}`;
  console.log(`Search Console setup for ${property}`);

  await verifyDomain(google, domain);

  await api(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}`,
    { method: "PUT", headers: google },
    "Search Console property creation",
    [200, 204],
  );
  console.log("✓ property added to Search Console");

  const sitemap = new URL("/sitemap-index.xml", siteUrl).href;
  await api(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemap)}`,
    { method: "PUT", headers: google },
    "sitemap submission",
    [200, 204],
  );
  console.log(`✓ sitemap submitted: ${sitemap}`);
  console.log("\nDone. Indexing coverage appears in Search Console within a few days.");
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
