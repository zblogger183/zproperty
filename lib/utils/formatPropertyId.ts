export function formatPropertyId(listingNumber: number): string {
  return `ZP-${listingNumber}`;
}

// Matches "ZP-100001" or bare "100001" — shared by admin search, the
// homepage search bar, and the public search-results query so a pasted
// Property ID is recognized identically everywhere.
const PROPERTY_ID_PATTERN = /^(?:zp-)?(\d+)$/i;

export function parsePropertyId(query: string): number | null {
  const match = query.trim().match(PROPERTY_ID_PATTERN);
  return match ? Number(match[1]) : null;
}
