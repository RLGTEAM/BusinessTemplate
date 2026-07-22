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
    await page.goto("/");
    await expect(page.getByText("שלום John 050-1234567 ₪1,234")).toBeVisible();
  });

  test("renders JSON-LD structured data", async ({ page }) => {
    await page.goto("/");
    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(3);
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
