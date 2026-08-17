// TipTap's StarterKit + the toolbar in Step5Description only ever produce
// these tags, with no attributes — but the API route never validates that
// server-side, so a direct POST to /api/listings could submit arbitrary
// HTML in `description`. This strips everything outside a fixed allowlist
// before it's ever used with dangerouslySetInnerHTML.
//
// A regex allowlist (rather than a full HTML parser like DOMPurify/jsdom)
// is deliberate: this only ever needs to recognize plain `<tag>`/`</tag>`
// markers with no attributes, and a jsdom-backed sanitizer instantiates a
// full DOM per call — measured at 10+ seconds per SSR request in this app,
// effectively making the page unusable. Every allowed tag is emitted
// attribute-free regardless of what was matched, so no attribute-based
// vector (onerror=, javascript: hrefs, style=) can survive; any
// disallowed tag (<script>, <img>, <a>, ...) is dropped entirely, leaving
// only its inner text content, which can't execute as markup.
const ALLOWED_TAGS = new Set(["p", "strong", "b", "em", "i", "ul", "ol", "li", "br"]);

export function sanitizeRichText(html: string): string {
  return html.replace(/<\/?([a-zA-Z0-9]+)(?:\s[^>]*)?>/g, (match, tagName: string) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    return match.startsWith("</") ? `</${tag}>` : `<${tag}>`;
  });
}
