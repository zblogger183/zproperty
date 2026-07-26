import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Renders `Home > City > Area > [current page]` and emits the matching
 * BreadcrumbList JSON-LD. Callers include "Home" as items[0] themselves —
 * this component just renders whatever list it's given.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

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
            {item.href && !isLast ? (
              <Link href={item.href} className="text-primary hover:text-primary-mid">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-black" : "text-primary"}>{item.label}</span>
            )}
          </span>
        );
      })}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </nav>
  );
}
