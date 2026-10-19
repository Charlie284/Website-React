import { describe, expect, it } from "vitest";
import {
  formatBlogDate,
  getAllBlogPosts,
  getBlogPostBySlug,
  parseBlogDate,
} from "./blog";

describe("blog content index", () => {
  it("parses date-only frontmatter in local time", () => {
    const date = parseBlogDate("2026-07-22");

    expect([
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    ]).toEqual([2026, 7, 22]);
    expect(formatBlogDate("2026-07-22")).toBe("July 22, 2026");
  });

  it("returns posts newest first and resolves every public slug", () => {
    const posts = getAllBlogPosts();

    expect(posts.length).toBeGreaterThan(0);
    expect(posts.map((post) => post.meta.slug)).toHaveLength(
      new Set(posts.map((post) => post.meta.slug)).size,
    );

    for (let index = 1; index < posts.length; index += 1) {
      expect(parseBlogDate(posts[index - 1].meta.date).getTime()).toBeGreaterThanOrEqual(
        parseBlogDate(posts[index].meta.date).getTime(),
      );
    }

    for (const post of posts) {
      expect(getBlogPostBySlug(post.meta.slug)?.meta.title).toBe(post.meta.title);
    }
    expect(getBlogPostBySlug("not-a-real-post")).toBeNull();
  });
});
