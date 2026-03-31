/**
 * CSS sanitizer for AI-generated scoped CSS.
 * Strips dangerous patterns: external URLs, expressions, imports, javascript protocol.
 */

/** Sanitize CSS string — remove dangerous patterns */
export function sanitizeCss(css: string): string {
  return css
    // Remove @import rules (can load external stylesheets)
    .replace(/@import\s+[^;]+;?/gi, '/* @import removed */')
    // Remove url() with external domains (data: URIs are OK)
    .replace(/url\s*\(\s*(['"]?)(?!data:)(https?:)?\/\/[^)]+\1\s*\)/gi, '/* external url removed */')
    // Remove expression() (IE CSS expressions)
    .replace(/expression\s*\([^)]*\)/gi, '/* expression removed */')
    // Remove javascript: protocol
    .replace(/javascript\s*:/gi, '/* javascript: removed */')
    // Remove -moz-binding (Firefox XBL)
    .replace(/-moz-binding\s*:[^;]+;?/gi, '/* -moz-binding removed */')
    // Remove behavior (IE HTC)
    .replace(/behavior\s*:[^;]+;?/gi, '/* behavior removed */')
}
