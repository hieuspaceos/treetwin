/**
 * content-io-shared — pure parsing/serialization helpers
 * Used by both LocalContentIO and GitHubContentIO to avoid duplication
 * No filesystem or network I/O here — only string transformations
 */
import matter from 'gray-matter'
import yaml from 'js-yaml'
import type { CollectionName } from './validation'

// ── Markdoc (.mdoc) helpers ──

/** Parse a Markdoc file (YAML frontmatter + body) into its parts */
export function parseMarkdocContent(raw: string): {
  frontmatter: Record<string, unknown>
  content: string
} {
  const { data, content } = matter(raw)
  return { frontmatter: data as Record<string, unknown>, content }
}

/** Serialize frontmatter + body back to a .mdoc file string */
export function serializeMarkdocContent(
  frontmatter: Record<string, unknown>,
  content: string,
): string {
  return matter.stringify(content || '', frontmatter)
}

// ── YAML helpers ──

/** Parse a raw YAML string into a plain object */
export function parseYamlContent(raw: string): Record<string, unknown> {
  return (yaml.load(raw) as Record<string, unknown>) ?? {}
}

/** Serialize a plain object to YAML string */
export function serializeYamlContent(data: Record<string, unknown>): string {
  return yaml.dump(data, { lineWidth: -1, noRefs: true })
}

// ── Collection format helper ──

/** Returns the file format used for a given collection */
export function getCollectionFormat(collection: CollectionName): 'markdoc' | 'yaml' {
  return collection === 'articles' ? 'markdoc' : 'yaml'
}
