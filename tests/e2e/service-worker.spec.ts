import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const workerTemplate = readFileSync("public/sw.js", "utf8");

test("worker updates wait for old tabs before removing their cached chunks", async ({ page, context }) => {
  let version = "v1";
  const server = createServer((request, response) => {
    const pathname = new URL(request.url!, "http://localhost").pathname;
    response.setHeader("Cache-Control", "no-store");
    if (pathname === "/sw.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(workerTemplate
        .replace('"BUILD_CACHE_VERSION"', JSON.stringify(version))
        .replace('["BUILD_PRECACHE_URLS"]', JSON.stringify(["/", `/assets/lazy-${version}.js`])));
    } else if (pathname === `/assets/lazy-${version}.js`) {
      response.setHeader("Content-Type", "text/javascript");
      response.end(`export default "${version}";`);
    } else if (pathname === "/") {
      response.setHeader("Content-Type", "text/html");
      response.end("<!doctype html><title>Worker update fixture</title><p>Worker update fixture</p>");
    } else {
      response.writeHead(404).end("Asset removed by the new deployment");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing fixture server address");
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    await page.goto(origin);
    await page.evaluate(async () => {
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
    });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

    version = "v2";
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration!.update();
    });
    await expect.poll(() => page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.waiting?.state;
    })).toBe("installed");

    const cachedVersions = await page.evaluate(() => caches.keys());
    expect(cachedVersions).toContain("charlie-site-v1");
    expect(cachedVersions).toContain("charlie-site-v2");
    const oldChunk = await page.evaluate(async () => {
      const response = await fetch("/assets/lazy-v1.js");
      return { status: response.status, body: await response.text() };
    });
    expect(oldChunk).toEqual({ status: 200, body: 'export default "v1";' });

    await page.close();
    const nextPage = await context.newPage();
    await nextPage.goto(origin);
    await expect.poll(() => nextPage.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.active?.state === "activated" && !registration.waiting &&
        !(await caches.keys()).includes("charlie-site-v1");
    })).toBe(true);
    expect(await nextPage.evaluate(() => caches.keys())).toContain("charlie-site-v2");
    await nextPage.close();
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
