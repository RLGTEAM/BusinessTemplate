import { expect, test } from "@playwright/test";
import business from "../src/content/business/business.json" with { type: "json" };

test.describe("home page", () => {
  test("renders with correct language and direction", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", business.locale);
    await expect(html).toHaveAttribute("dir", "rtl");
  });

  test("has exactly one h1, sourced from business.json", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(business.content.hero.headline);
  });

  test("renders the bidi test string", async ({ page }) => {
    // The about body must contain a mixed Hebrew/Latin/number/currency line
    // (the /new-client skill keeps one) — assert it renders, whatever it says.
    const bidiLine = business.content.about.body.find(
      (paragraph) => /[A-Za-z]/.test(paragraph) && /₪/.test(paragraph),
    );
    expect(bidiLine, "business.json must keep a bidi test line in content.about.body").toBeTruthy();
    await page.goto("/");
    await expect(page.getByText(bidiLine as string)).toBeVisible();
  });

  test("renders JSON-LD structured data", async ({ page }) => {
    await page.goto("/");
    // LocalBusiness, Organization, WebSite, FAQPage
    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(4);
    const first = await scripts.first().textContent();
    expect(first).toContain("LocalBusiness");
  });

  test("all sections are present", async ({ page }) => {
    await page.goto("/");
    for (const id of ["services", "about", "testimonials", "gallery", "faq", "contact"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test("contact form blocks empty submit and shows field errors", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#contact-form");
    await form.scrollIntoViewIfNeeded();
    await form.locator('button[type="submit"]').click();
    await expect(form.locator("#name-error")).toHaveText(
      business.content.contactForm.requiredError,
    );
    await expect(form.locator("#name")).toBeFocused();
  });

  test("404 page renders", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist/");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText(business.content.notFound.title);
  });

  test("legal pages render and are linked from the footer", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("body > footer");
    await expect(
      footer.getByRole("link", { name: business.content.legal.accessibility.title }),
    ).toBeAttached();
    await expect(
      footer.getByRole("link", { name: business.content.legal.privacy.title }),
    ).toBeAttached();

    await page.goto("/accessibility-statement/");
    await expect(page.locator("h1")).toHaveText(business.content.legal.accessibility.title);
    await expect(
      page.getByText(business.content.legal.accessibility.coordinator.name),
    ).toBeVisible();

    await page.goto("/privacy/");
    await expect(page.locator("h1")).toHaveText(business.content.legal.privacy.title);
  });

  test("consent banner absent when no cookie-based trackers are configured", async ({ page }) => {
    const hasTracking =
      business.data.analytics.gtagId !== "" || business.data.analytics.metaPixelId !== "";
    await page.goto("/");
    if (hasTracking) {
      await expect(page.locator("#consent-banner")).toBeVisible();
    } else {
      await expect(page.locator("#consent-banner")).toHaveCount(0);
    }
  });

  test("AEO/PWA endpoints respond", async ({ request }) => {
    const llms = await request.get("/llms.txt");
    expect(llms.status()).toBe(200);
    expect(await llms.text()).toContain(business.data.name);

    const manifest = await request.get("/site.webmanifest");
    expect(manifest.status()).toBe(200);
    const parsed = (await manifest.json()) as { name: string };
    expect(parsed.name).toBe(business.data.name);
  });

  test("contact form flags an invalid email", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#contact-form");
    await form.scrollIntoViewIfNeeded();
    await form.locator("#name").fill("ישראל ישראלי");
    await form.locator("#email").fill("not-an-email");
    await form.locator("#phone").fill("0501234567");
    await form.locator("#message").fill("בדיקה");
    await form.locator('button[type="submit"]').click();
    await expect(form.locator("#email-error")).toHaveText(business.content.contactForm.emailError);
  });
});
