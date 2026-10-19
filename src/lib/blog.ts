import { lazy, type ComponentType } from "react";
import type { MDXProps } from "mdx/types";

export interface BlogPostFrontmatter {
  title: string;
  date: string;
  description: string;
  slug: string;
  tags: string[];
  wordCount: number;
  updated?: string; // optional last-updated date
}

export interface BlogPost {
  meta: BlogPostFrontmatter;
  Content: ComponentType<MDXProps>;
  wordCount: number;
}

interface BlogModule {
  default: ComponentType<MDXProps>;
  frontmatter: BlogPostFrontmatter;
}

// Listings need metadata, not the code and markup of every article.
const frontmatter = import.meta.glob<BlogPostFrontmatter>("/src/content/blog/*.mdx", {
  eager: true,
  import: "frontmatter",
  query: "?metadata",
});
const articleLoaders = import.meta.glob<BlogModule>("/src/content/blog/*.mdx");

export function parseBlogDate(date: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(date);
}

function sortPostsNewestFirst(a: BlogPost, b: BlogPost) {
  return parseBlogDate(b.meta.date).getTime() - parseBlogDate(a.meta.date).getTime();
}

function normalizePost(frontmatter: BlogPostFrontmatter, path: string): BlogPost {
  const fallbackSlug = path.split("/").pop()?.replace(/\.mdx$/, "") ?? "";
  const meta = {
    ...frontmatter,
    slug: frontmatter.slug || fallbackSlug,
    tags: Array.isArray(frontmatter.tags)
      ? frontmatter.tags
      : [],
  };

  return {
    meta,
    Content: lazy(articleLoaders[path]),
    wordCount: frontmatter.wordCount,
  };
}

const allPosts = Object.entries(frontmatter)
  .map(([path, module]) => normalizePost(module, path))
  .sort(sortPostsNewestFirst);

export function getAllBlogPosts(): BlogPost[] {
  return allPosts;
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return allPosts.find((post) => post.meta.slug === slug) ?? null;
}

export function formatBlogDate(date: string): string {
  return parseBlogDate(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// The server entry supplies synchronous components for renderToString.
export function setPrerenderedArticles(articles: Record<string, ComponentType<MDXProps>>) {
  for (const [path, Content] of Object.entries(articles)) {
    const post = allPosts.find((entry) => entry.meta.slug ===
      (frontmatter[path].slug || path.split("/").pop()?.replace(/\.mdx$/, "")));
    if (post) post.Content = Content;
  }
}
