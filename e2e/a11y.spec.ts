import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Automated accessibility scan (WCAG 2.0/2.1 A + AA) of the key public surfaces.
// Data-independent: chrome and structure are present regardless of DB contents.
const ROUTES = ["/", "/directory", "/events", "/marketplace", "/feed", "/pricing", "/login"];

for (const path of ROUTES) {
  test(`${path} has no serious/critical accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // .ledger-numeral is an intentionally faint, aria-hidden, non-selectable
      // engraving ornament (the numeral "01/02/03" duplicates the visible step
      // order that adjacent real text already conveys). It carries no
      // information for any user, so its low contrast is decorative by design.
      .exclude(".ledger-numeral")
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    // Surface a readable summary on failure.
    if (blocking.length) {
      console.error(
        `A11y violations on ${path}:\n` +
          blocking
            .map((v) => `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
            .join("\n"),
      );
    }
    expect(blocking).toEqual([]);
  });
}
