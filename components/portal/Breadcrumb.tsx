import Link from "next/link";
import { SchemaScript, breadcrumbSchema } from "@/lib/seo/schemas";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * Renders `Home > City > Area > [current page]` and emits the matching
 * BreadcrumbList JSON-LD via the shared breadcrumbSchema() helper (so it
 * gets the same absolute-URL resolution as every other page's explicit
 * SchemaScript call, instead of a second, independently-drifting
 * implementation). Callers include "Home" as items[0] themselves — this
 * component just renders whatever list it's given. Every item, including
 * the last (current page), must carry its own href for the JSON-LD to be
 * valid -- the last item still renders as plain, non-clickable text below.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="text-primary-mid">
                &gt;
              </span>
            )}
            {!isLast ? (
              <Link href={item.href} className="text-primary hover:text-primary-mid">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-black">{item.label}</span>
            )}
          </span>
        );
      })}
      <SchemaScript
        schema={breadcrumbSchema(items.map((item) => ({ name: item.label, href: item.href })))}
      />
    </nav>
  );
}
