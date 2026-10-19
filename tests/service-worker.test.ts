import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { URL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync("public/sw.js", "utf8");
const origin = "https://example.test";

function createWorker() {
  type RequestDetails = Pick<Request, "url" | "method" | "mode" | "destination">;
  type FetchEvent = {
    request: RequestDetails;
    respondWith: (response: Promise<Response>) => void;
  };
  const listeners = new Map<string, (event: FetchEvent) => void>();
  const cache = {
    match: vi.fn<() => Promise<Response | undefined>>().mockResolvedValue(undefined),
    put: vi.fn<(request: RequestDetails, response: Response) => Promise<void>>().mockResolvedValue(undefined),
  };
  const caches = { open: vi.fn(async () => cache) };
  const fetch = vi.fn(async () => new Response("fresh network content"));

  runInNewContext(source, {
    self: {
      location: { origin },
      addEventListener: (name: string, listener: (event: FetchEvent) => void) => {
        listeners.set(name, listener);
      },
    },
    caches,
    fetch,
    URL,
    Response,
  });

  async function request(path: string, mode: RequestMode = "cors") {
    let response: Promise<Response> | undefined;
    listeners.get("fetch")!({
      request: {
        url: new URL(path, origin).href,
        method: "GET",
        mode,
        destination: mode === "navigate" ? "document" : "script",
      },
      respondWith: (result) => { response = result; },
    });
    if (!response) throw new Error("The worker did not handle the request");
    return response;
  }

  return { cache, caches, fetch, request };
}

describe("service worker cache failures", () => {
  for (const { path, mode } of [
    { path: "/assets/new.js", mode: "cors" },
    { path: "/projects", mode: "navigate" },
  ] as const) {
    const operations = mode === "navigate" ? ["open", "put"] as const : ["open", "match", "put"] as const;
    it.each(operations)(
      `delivers the network response for ${path} when cache %s fails`,
      async (operation) => {
        const worker = createWorker();
        const failure = new DOMException("Storage unavailable", "QuotaExceededError");
        if (operation === "open") worker.caches.open.mockRejectedValue(failure);
        else worker.cache[operation].mockRejectedValue(failure);

        const response = await worker.request(path, mode);

        expect(response.status).toBe(200);
        expect(await response.text()).toBe("fresh network content");
      },
    );
  }

  it("still caches successful responses when storage is available", async () => {
    const worker = createWorker();

    const response = await worker.request("/assets/new.js");

    expect(await response.text()).toBe("fresh network content");
    expect(worker.cache.put).toHaveBeenCalledOnce();
    const [, cachedResponse] = worker.cache.put.mock.calls[0];
    expect(await cachedResponse.text()).toBe("fresh network content");
  });

  it("serves an already cached asset without a network request", async () => {
    const worker = createWorker();
    worker.cache.match.mockResolvedValue(new Response("cached asset"));

    expect(await (await worker.request("/assets/cached.js")).text()).toBe("cached asset");
    expect(worker.fetch).not.toHaveBeenCalled();
  });

  it("uses cached document content when the network fails", async () => {
    const worker = createWorker();
    worker.fetch.mockRejectedValue(new TypeError("Offline"));
    worker.cache.match.mockResolvedValue(new Response("cached page"));

    expect(await (await worker.request("/projects", "navigate")).text()).toBe("cached page");
  });
});
