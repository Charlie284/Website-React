import { expect, test } from "@playwright/test";

test("blog leads with a featured post and keeps archive filtering usable", async ({ page }) => {
  await page.goto("/blog");
  const buildStory = page.getByRole("link", { name: /One from the archive/i });
  await expect(buildStory).toBeInViewport();
  const storyBounds = await buildStory.boundingBox();
  const signupBounds = await page.getByRole("region", { name: "Still learning." }).boundingBox();
  expect(storyBounds!.y + storyBounds!.height).toBeLessThan(signupBounds!.y);

  await page.getByRole("textbox", { name: "Search blog posts" }).fill("tailscale");
  await expect(page.getByRole("link", { name: /Tailscale vs WireGuard/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Theo \(t3\) Hates Open Source/i })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search blog posts" }).fill("no-matching-post-1234");
  await expect(page.getByText("I could not find a post matching that.")).toBeVisible();
});

test("capabilities heading does not collide with its introduction at intermediate widths", async ({ page }) => {
  for (const width of [320, 1024, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const region = page.getByRole("region", { name: "What I work with" });
    const heading = await region.getByRole("heading", { name: "What I work with", exact: true }).boundingBox();
    const copy = await region.getByText(/^I mostly build native apps/).boundingBox();
    expect(heading).not.toBeNull();
    expect(copy).not.toBeNull();
    expect(heading!.y + heading!.height <= copy!.y || heading!.x + heading!.width <= copy!.x).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
