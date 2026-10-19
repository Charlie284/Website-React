import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { expect, it } from "vitest";

it("preserves literal replacement tokens in generated article HTML and metadata", () => {
  const fixture = mkdtempSync(join(tmpdir(), "website-metadata-"));
  const literal = "Metadata tokens: $& $$ <example>";
  const bodyLiteral = "Body tokens: $& $' $` $$ <example>";
  const escaped = bodyLiteral.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  try {
    for (const directory of ["dist", "src/content/blog", ".prerender"]) {
      mkdirSync(join(fixture, directory), { recursive: true });
    }
    writeFileSync(join(fixture, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(fixture, "dist/index.html"), '<!doctype html><html><head><title>Template</title><meta name="description" content="Template"></head><body><div id="root"></div></body></html>');
    writeFileSync(join(fixture, ".prerender/entry-server.js"), `export const render = () => ${JSON.stringify(`<p>${escaped}</p>`)};`);
    writeFileSync(join(fixture, "src/content/blog/replacement-tokens.mdx"), [
      "---",
      `title: ${JSON.stringify(literal)}`,
      `description: ${JSON.stringify(literal)}`,
      'slug: "replacement-tokens"',
      'date: "2026-10-19"',
      "---",
      literal,
    ].join("\n"));

    execFileSync(process.execPath, [resolve("scripts/generate-static-metadata.mjs")], { cwd: fixture });

    const html = readFileSync(join(fixture, "dist/blog/replacement-tokens.html"), "utf8");
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.querySelectorAll("#root")).toHaveLength(1);
    expect(document.querySelector("#root")!.textContent).toBe(bodyLiteral);
    expect(document.title).toBe(`${literal} — Charlie H`);
    expect(document.querySelector('meta[name="description"]')!.getAttribute("content")).toBe(literal);
    expect(document.querySelector('meta[property="og:title"]')!.getAttribute("content")).toBe(`${literal} — Charlie H`);
    const structuredData = JSON.parse(document.querySelector("#route-structured-data")!.textContent!);
    expect(structuredData.headline).toBe(literal);
    expect(structuredData.description).toBe(literal);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
