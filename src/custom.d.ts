declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { BlogPostFrontmatter } from "./lib/blog";

  const Component: ComponentType;
  export default Component;
  export const frontmatter: BlogPostFrontmatter;
}
