import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const blogDir = path.join(rootDir, "src/content/blog");
const serverEntry = path.join(rootDir, ".prerender/entry-server.js");
const siteUrl = "https://clh.lol";
const defaultImage = `${siteUrl}/website-screenshot.png`;
const { render } = await import(pathToFileURL(serverEntry).href);

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const parseValue = (value) => {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  return trimmed;
};

const readFrontmatter = (source) => {
  const block = /^---\s*\n([\s\S]*?)\n---/.exec(source)?.[1] ?? "";
  const result = {};
  for (const line of block.split("\n")) {
    const match = /^(\w+):\s*(.+)$/.exec(line);
    if (match) result[match[1]] = parseValue(match[2]);
  }
  return result;
};

const setTitle = (html, title) =>
  html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

const setMeta = (html, attribute, key, value) => {
  const expression = new RegExp(`<meta\\s+[^>]*${attribute}=["']${key}["'][^>]*>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(value)}">`;
  return expression.test(html) ? html.replace(expression, tag) : html.replace("</head>", `    ${tag}\n</head>`);
};

const setCanonical = (html, url) => {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}">`;
  return /<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(html)
    ? html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i, tag)
    : html.replace("</head>", `    ${tag}\n</head>`);
};

const addStructuredData = (html, data) => {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return html.replace(
    "</head>",
    `    <script id="route-structured-data" type="application/ld+json">${json}</script>\n</head>`,
  );
};

const renderMetadata = (template, route) => {
  const url = new URL(route.path, siteUrl).toString();
  const image = new URL(route.image ?? defaultImage, siteUrl).toString();
  let html = setTitle(template, route.title);
  html = setMeta(html, "name", "description", route.description);
  html = setMeta(html, "name", "robots", route.noIndex ? "noindex, nofollow" : "index, follow");
  html = setMeta(html, "property", "og:type", route.type ?? "website");
  html = setMeta(html, "property", "og:title", route.title);
  html = setMeta(html, "property", "og:description", route.description);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:image", image);
  html = setMeta(html, "name", "twitter:card", "summary_large_image");
  html = setMeta(html, "name", "twitter:title", route.title);
  html = setMeta(html, "name", "twitter:description", route.description);
  html = setMeta(html, "name", "twitter:image", image);
  html = setCanonical(html, url);

  if (route.type === "article") {
    html = setMeta(html, "property", "article:published_time", route.datePublished);
    html = setMeta(html, "property", "article:modified_time", route.dateModified);
    html = addStructuredData(html, {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: route.headline,
      description: route.description,
      image: [image],
      datePublished: route.datePublished,
      dateModified: route.dateModified,
      author: {
        "@type": "Person",
        name: "Charlie H",
        url: siteUrl,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
      url,
    });
  }

  return html;
};

const setRenderedContent = (html, content) => {
  const root = /<div\s+id=["']root["']><\/div>/i;
  if (!root.test(html)) {
    throw new Error("The client HTML template is missing an empty #root element");
  }
  return html.replace(root, `<div id="root">${content}</div>`);
};

const staticRoutes = [
  {
    path: "/",
    title: "Charlie H — Developer Portfolio",
    description: "Charlie is a student developer building a macOS app, websites, and a homelab.",
  },
  {
    path: "/projects",
    title: "Projects — Charlie H",
    description: "Apps, websites, small tools, and a homelab built by Charlie H.",
  },
  {
    path: "/projects/thiswebsite",
    title: "This Website — Charlie H",
    description: "How Charlie built this site with React, TypeScript, Framer Motion, and MDX.",
  },
  {
    path: "/projects/new-trier-block",
    title: "New Trier Block — Charlie H",
    description: "A case study of New Trier Block, a Flutter bell-schedule app with a period countdown, personal class schedules, and an iOS widget.",
  },
  {
    path: "/projects/startle",
    title: "Startle for macOS — Charlie H",
    description: "How Charlie built Startle, a local-first macOS menu bar utility with scheduling, safety gates, and private local media.",
    image: "/startle-app-icon.png",
  },
  {
    path: "/projects/server",
    title: "Server Project — Charlie H",
    description: "A personal homelab built from repurposed hardware with Ubuntu Server, Docker Compose, Portainer, Jellyfin, and Homarr.",
  },
  {
    path: "/blog",
    title: "Blog — Charlie H",
    description: "Notes from Charlie about Linux, self-hosting, privacy, and building software.",
  },
  {
    path: "/privacy",
    title: "Privacy — Charlie H",
    description: "How newsletter subscriptions and basic site data are handled on clh.lol.",
  },
  {
    path: "/newsletter-confirmed",
    title: "Newsletter — Charlie H",
    description: "Confirm your newsletter subscription through Kit and choose whether to hide signup prompts in this browser.",
    noIndex: true,
  },
];

const blogFiles = (await readdir(blogDir)).filter((file) => file.endsWith(".mdx"));
const blogRoutes = [];
for (const file of blogFiles) {
  const source = await readFile(path.join(blogDir, file), "utf8");
  const meta = readFrontmatter(source);
  if (!meta.slug || !meta.title || !meta.description || !meta.date) {
    throw new Error(`Missing required frontmatter in ${file}`);
  }
  blogRoutes.push({
    path: `/blog/${meta.slug}`,
    title: `${meta.title} — Charlie H`,
    headline: meta.title,
    description: meta.description,
    type: "article",
    datePublished: meta.date,
    dateModified: meta.updated ?? meta.date,
    lastmod: meta.updated ?? meta.date,
  });
}

const template = await readFile(path.join(distDir, "index.html"), "utf8");
const routes = [...staticRoutes, ...blogRoutes];
for (const route of routes) {
  const outputs = route.path === "/"
    ? [path.join(distDir, "index.html")]
    : [
        path.join(distDir, `${route.path.slice(1)}.html`),
        path.join(distDir, route.path.slice(1), "index.html"),
      ];
  const content = await render(route.path);
  const html = setRenderedContent(renderMetadata(template, route), content);
  for (const output of outputs) {
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html, "utf8");
  }
}

const notFound = setRenderedContent(renderMetadata(template, {
  path: "/404",
  title: "Page Not Found — Charlie H",
  description: "That page is missing, but the rest of Charlie H's portfolio is still here.",
  noIndex: true,
}), await render("/404"));
await writeFile(path.join(distDir, "404.html"), notFound, "utf8");

const sitemapRoutes = routes
  .filter((route) => !route.noIndex)
  .map((route) => {
    const location = new URL(route.path, siteUrl).toString();
    const lastmod = route.lastmod ? `\n    <lastmod>${route.lastmod}</lastmod>` : "";
    return `  <url>\n    <loc>${location}</loc>${lastmod}\n  </url>`;
  })
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes}\n</urlset>\n`;
await writeFile(path.join(distDir, "sitemap.xml"), sitemap, "utf8");

// Legacy SPA fallbacks turn genuine missing URLs into soft 404s. Known routes
// now have static entry files, so these files should not ship in the build.
await Promise.all([
  rm(path.join(distDir, "_redirects"), { force: true }),
  rm(path.join(distDir, "_routes.json"), { force: true }),
  rm(path.join(rootDir, ".prerender"), { force: true, recursive: true }),
]);

console.log(`Generated metadata for ${routes.length} routes plus sitemap.xml and 404.html.`);
