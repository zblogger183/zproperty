import sanitizeHtml from "sanitize-html";

// TipTap's StarterKit + the toolbar in Step5Description only ever produce
// these tags, with no attributes — but the API route never validates that
// server-side, so a direct POST to /api/listings could submit arbitrary
// HTML in `description`. This strips everything outside a fixed allowlist
// before it's ever used with dangerouslySetInnerHTML.
//
// Uses sanitize-html (a real parser, htmlparser2-based) rather than a regex
// allowlist — a prior regex-based version was found to fail open on
// malformed tags like `<svg/onload=...>` (no whitespace before the
// attribute), which browsers still parse as a live element. A real parser
// doesn't have that gap and is cheap (no jsdom/full-DOM instantiation).
const ALLOWED_TAGS = ["p", "strong", "b", "em", "i", "ul", "ol", "li", "br"];

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}
