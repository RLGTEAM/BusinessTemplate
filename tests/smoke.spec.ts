import { expect, test } from "@playwright/test";
import business from "../src/content/business/business.json" with { type: "json" };
import { collectStrings, navSectionIds } from "./contract";

/**
 * Contract-driven smoke tests. Expectations derive from the frozen parts of
 * business.json plus generic invariants that hold for every site. Per-client
 * content shapes (hero copy, section strings) are off-limits here — a bespoke
 * page must pass this suite without edits. Site-specific behavior gets ADDED
 * tests in the client repo, never edits to these.
 */

test.describe("home page", () => {
  test("renders with correct language and direction", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", business.locale);
    await expect(html).toHaveAttribute("dir", business.locale === "he" ? "rtl" : "ltr");
  });

  test("has exactly one non-empty h1", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).not.toBeEmpty();
  });

  test("every nav link resolves to a real section id", async ({ page }) => {
    expect(navSectionIds.length, "nav must contain at least one #section link").toBeGreaterThan(0);
    await page.goto("/");
    for (const id of navSectionIds) {
      await expect(page.locator(`#${id}`), `nav promises #${id}`).toBeAttached();
    }
  });

  test("renders a bidi test string (Hebrew sites)", async ({ page }) => {
    test.skip(business.locale !== "he", "bidi line only required for Hebrew sites");
    // Longest qualifying string — bidi test lines are full sentences kept in
    // visible body copy (the /new-client skill maintains one).
    const bidiLine = collectStrings(business.content)
      .filter((s) => /[א-ת]/.test(s) && /[A-Za-z]/.test(s) && /₪/.test(s))
      .sort((a, b) => b.length - a.length)[0];
    expect(bidiLine, "content must keep a bidi test line (Hebrew + Latin + ₪)").toBeTruthy();
    await page.goto("/");
    await expect(page.getByText(bidiLine as string)).toBeVisible();
  });

  test("mobile drawer opens on top of the page in the scrolled state", async ({ page }) => {
    // Every shipped site has had this defect: the drawer works at scroll-0 but
    // fails after scrolling, because backdrop-filter/transform on <header> (often
    // only via [data-scrolled]) turns it into the containing block for a
    // position:fixed drawer. Verify in the scrolled state, where it breaks.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const toggle = page.locator("#menu-toggle");
    test.skip((await toggle.count()) === 0, "site has no #menu-toggle");
    test.skip(!(await toggle.isVisible()), "menu toggle not shown at mobile width");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(600); // let data-scrolled flip and its CSS settle

    await toggle.click(); // actionability also proves the toggle itself is hit-testable
    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeVisible();
    await page.waitForTimeout(400); // let any entrance animation finish

    // A fixed drawer must be positioned against the viewport: no ancestor may
    // create a containing block for it.
    const traps = await menu.evaluate((el) => {
      if (getComputedStyle(el).position !== "fixed") return [];
      const found: string[] = [];
      for (let a = el.parentElement; a !== null && a !== document.body; a = a.parentElement) {
        const s = getComputedStyle(a);
        const offending: Array<[string, string]> = [];
        for (const prop of ["transform", "filter", "backdrop-filter", "perspective"]) {
          const v = s.getPropertyValue(prop);
          if (v !== "" && v !== "none") offending.push([prop, v]);
        }
        const contain = s.getPropertyValue("contain");
        if (/\b(layout|paint|strict|content)\b/.test(contain)) offending.push(["contain", contain]);
        const willChange = s.getPropertyValue("will-change");
        if (/\b(transform|filter|backdrop-filter|perspective)\b/.test(willChange))
          offending.push(["will-change", willChange]);
        if (offending.length > 0)
          found.push(
            `<${a.tagName.toLowerCase()}> { ${offending.map(([p, v]) => `${p}: ${v}`).join("; ")} }`,
          );
      }
      return found;
    });
    expect(
      traps,
      `fixed drawer is trapped by a containing-block ancestor (move the effect to an inner bar — RECIPES recipe 2): ${traps.join(" | ")}`,
    ).toEqual([]);

    // The drawer's first link must actually be hit-testable — visible is not
    // enough; content stacked above it means the user cannot tap it.
    const link = menu.locator("a").first();
    await expect(link).toBeVisible();
    const onTop = await link.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit !== null && (el === hit || el.contains(hit) || hit.contains(el));
    });
    expect(onTop, "drawer link must sit above all page content").toBe(true);
  });

  test("renders JSON-LD structured data", async ({ page }) => {
    await page.goto("/");
    // LocalBusiness, Organization, WebSite, + FAQPage when content.faq has items
    const scripts = page.locator('script[type="application/ld+json"]');
    const content = business.content as Record<string, unknown>;
    const faq = typeof content.faq === "object" && content.faq !== null ? content.faq : null;
    const hasFaq =
      Array.isArray((faq as Record<string, unknown> | null)?.items) &&
      ((faq as Record<string, unknown>).items as unknown[]).length > 0;
    await expect(scripts).toHaveCount(hasFaq ? 4 : 3);
    const first = await scripts.first().textContent();
    expect(first).toContain("LocalBusiness");
  });

  test("contact form blocks an empty submit", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("form[data-contact-form]").first();
    test.skip((await form.count()) === 0, "site has no form[data-contact-form]");
    await form.scrollIntoViewIfNeeded();
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[id$="-error"]').first()).not.toBeEmpty();
  });

  test("contact form flags an invalid email", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("form[data-contact-form]").first();
    test.skip((await form.count()) === 0, "site has no form[data-contact-form]");
    test.skip((await form.locator("#email").count()) === 0, "form has no #email field");
    for (const field of ["#name", "#phone", "#message"]) {
      const input = form.locator(field);
      if ((await input.count()) > 0) {
        await input.fill("בדיקה 050-1234567");
      }
    }
    await form.locator("#email").fill("not-an-email");
    await form.locator('button[type="submit"]').click();
    await expect(form.locator("#email-error")).not.toBeEmpty();
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
});
