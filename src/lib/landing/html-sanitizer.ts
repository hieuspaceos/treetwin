/**
 * HTML sanitizer for landing page content — prevents XSS via user-controlled HTML.
 * Uses sanitize-html (already installed as dependency) with a strict allowlist.
 */
import sanitizeHtml from 'sanitize-html'

/** Sanitize user-controlled HTML content for safe rendering */
export function sanitizeLandingHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'a', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
      'blockquote', 'pre', 'code',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'section',
      'iframe', 'video', 'source',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'title'],
      video: ['src', 'width', 'height', 'controls', 'autoplay', 'muted', 'loop', 'poster'],
      source: ['src', 'type'],
      div: ['class', 'style'],
      span: ['class', 'style'],
      section: ['class', 'style'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Block javascript: in href/src
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto'],
      img: ['http', 'https', 'data'],
      iframe: ['http', 'https'],
    },
    // Strip all event handlers (onclick, onerror, onload, etc.)
    disallowedTagsMode: 'discard',
    // Allow safe inline styles but strip dangerous ones
    allowedStyles: {
      '*': {
        'color': [/.*/],
        'background-color': [/.*/],
        'background': [/^(?!.*url\s*\()(?!.*expression\s*\().*/],
        'font-size': [/.*/],
        'font-weight': [/.*/],
        'font-family': [/.*/],
        'text-align': [/.*/],
        'text-decoration': [/.*/],
        'margin': [/.*/],
        'margin-top': [/.*/],
        'margin-bottom': [/.*/],
        'margin-left': [/.*/],
        'margin-right': [/.*/],
        'padding': [/.*/],
        'padding-top': [/.*/],
        'padding-bottom': [/.*/],
        'padding-left': [/.*/],
        'padding-right': [/.*/],
        'display': [/.*/],
        'gap': [/.*/],
        'grid-template-columns': [/.*/],
        'max-width': [/.*/],
        'width': [/.*/],
        'height': [/.*/],
        'border-radius': [/.*/],
        'border': [/.*/],
        'line-height': [/.*/],
        'letter-spacing': [/.*/],
        'opacity': [/.*/],
      },
    },
  })
}

/** Sanitize embed HTML — only allow iframe and video elements */
export function sanitizeEmbed(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ['iframe', 'video', 'source'],
    allowedAttributes: {
      iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'title', 'allow'],
      video: ['src', 'width', 'height', 'controls', 'autoplay', 'muted', 'loop', 'poster'],
      source: ['src', 'type'],
    },
    allowedSchemes: ['http', 'https'],
  })
}
