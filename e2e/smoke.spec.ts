import { test, expect } from "@playwright/test";

// Data-independent smoke tests: they assert on chrome (headings, header, nav,
// theme, 404) — never on seeded data — so they pass against an empty or full DB.

const PUBLIC_ROUTES = [
  "/",
  "/directory",
  "/events",
  "/marketplace",
  "/feed",
  "/pricing",
  "/login",
];

test.describe("public pages render", () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} renders with a heading and the site header`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("header").first()).toBeVisible();
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }
});

test("primary navigation works from the header", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Directory", exact: true }).first().click();
  await expect(page).toHaveURL(/\/directory/);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("theme toggle applies and persists .dark across reload", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: /Theme/ });

  // Cycle until dark is on (system → dark → light), max a few clicks.
  for (let i = 0; i < 3; i++) {
    if (await html.evaluate((el) => el.classList.contains("dark"))) break;
    await toggle.click();
    await page.waitForTimeout(150);
  }
  await expect(html).toHaveClass(/dark/);

  await page.reload();
  await expect(html).toHaveClass(/dark/); // no-FOUC script re-applies the choice
});

test("unknown routes render the not-found page", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist-xyz");
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/not found|doesn't exist|404/i).first()).toBeVisible();
});
