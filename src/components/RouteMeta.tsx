import { useEffect } from "react";

const SITE_URL = "https://clh.lol";
const DEFAULT_IMAGE = `${SITE_URL}/website-screenshot.png`;

type RouteMetaProps = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
};

function setMeta(selector: string, attribute: "name" | "property", value: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.content = content;
}

function removeMeta(selector: string) {
  document.head.querySelector(selector)?.remove();
}

function setArticleStructuredData(data: Record<string, unknown>) {
  let element = document.head.querySelector<HTMLScriptElement>("#route-structured-data");
  if (!element) {
    element = document.createElement("script");
    element.id = "route-structured-data";
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

export default function RouteMeta({
  title,
  description,
  path,
  type = "website",
  image = DEFAULT_IMAGE,
  noIndex = false,
  publishedTime,
  modifiedTime,
}: RouteMetaProps) {
  useEffect(() => {
    const pageTitle = title === "Charlie H" ? "Charlie H — Developer Portfolio" : `${title} — Charlie H`;
    const canonicalUrl = new URL(path, SITE_URL).toString();
    const absoluteImage = new URL(image, SITE_URL).toString();

    document.title = pageTitle;
    document.documentElement.lang = "en";

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[name="robots"]', "name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[property="og:title"]', "property", "og:title", pageTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[property="og:image"]', "property", "og:image", absoluteImage);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", pageTitle);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", absoluteImage);

    if (type === "article" && publishedTime) {
      const resolvedModifiedTime = modifiedTime ?? publishedTime;
      setMeta(
        'meta[property="article:published_time"]',
        "property",
        "article:published_time",
        publishedTime,
      );
      setMeta(
        'meta[property="article:modified_time"]',
        "property",
        "article:modified_time",
        resolvedModifiedTime,
      );
      setArticleStructuredData({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description,
        image: [absoluteImage],
        datePublished: publishedTime,
        dateModified: resolvedModifiedTime,
        author: {
          "@type": "Person",
          name: "Charlie H",
          url: SITE_URL,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
        url: canonicalUrl,
      });
    } else {
      removeMeta('meta[property="article:published_time"]');
      removeMeta('meta[property="article:modified_time"]');
      document.head.querySelector("#route-structured-data")?.remove();
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [description, image, modifiedTime, noIndex, path, publishedTime, title, type]);

  return null;
}
