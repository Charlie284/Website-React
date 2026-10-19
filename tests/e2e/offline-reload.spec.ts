import { expect, test } from "@playwright/test";

for (const route of [
  { path: "/projects", title: /Things I've\s*built/i },
  { path: "/blog/why-i-hate-raycast", title: /Why I Hate Raycast/i },
]) {
  test(`client-visited ${route.path} reloads offline without a hydration mismatch`, async ({ page, context, baseURL }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await context.addCookies([{ name: "clh_cookie_choice", value: "deny", url: baseURL! }]);
    await page.goto("/");
    await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
        });
      }
    });
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    if (route.path === "/projects") {
      await nav.getByRole("link", { name: "Projects", exact: true }).click();
    } else {
      await nav.getByRole("link", { name: "Blog", exact: true }).click();
      await page.getByRole("link", { name: /Why I Hate Raycast/i }).first().click();
      await expect(page.locator(".blog-prose > *").first()).toBeVisible();
    }
    await expect(page).toHaveURL(new RegExp(`${route.path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.title);
    await expect(page.locator('[data-route-ready="true"]')).toBeVisible();

    const failedAssets: string[] = [];
    page.on("requestfailed", (request) => {
      if (["script", "stylesheet", "font"].includes(request.resourceType()) &&
        new URL(request.url()).origin === new URL(page.url()).origin) failedAssets.push(request.url());
    });
    await context.setOffline(true);
    try {
      const response = await page.reload();
      expect(await response!.text()).toMatch(/<div\s+id="root">\s*<\/div>/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.title);
      await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
      if (route.path.startsWith("/blog/")) {
        await expect(page.locator(".blog-prose > *").first()).toBeVisible();
      }
      expect(failedAssets).toEqual([]);
      expect(errors).toEqual([]);
    } finally {
      await context.setOffline(false);
    }
  });
}
