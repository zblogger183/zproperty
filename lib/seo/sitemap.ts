export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export function buildSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
  return entries;
}
