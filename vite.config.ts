import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { rehypePrettyCode } from 'rehype-pretty-code'
import mdx from '@mdx-js/rollup'

type RehypeNode = {
  children: unknown[]
  properties: {
    className: string[]
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mdx({
      include: /\.mdx\?metadata$/,
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        () => (tree: { children: { type: string }[] }) => {
          tree.children = tree.children.filter((node) => node.type === "mdxjsEsm");
        },
      ],
    }),
    mdx({
      // Use remark plugins to parse frontmatter
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
      // Use rehype plugins for syntax highlighting
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            theme: 'github-dark',
            onVisitLine(node: RehypeNode) {
              // Prevent lines from becoming overly wide
              if (node.children.length === 0) {
                node.children = [{ type: 'text', value: ' ' }]
              }
            },
            onVisitHighlightedLine(node: RehypeNode) {
              node.properties.className.push('highlighted')
            },
            onVisitHighlightedEmpty(node: RehypeNode) {
              node.properties.className.push('empty')
            },
          },
        ],
      ],
    }),
    react(),
  ],
  build: {
    manifest: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'INEFFECTIVE_DYNAMIC_IMPORT') return
        warn(warning)
      },
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    setupFiles: './src/test/setup.ts',
  },
})
