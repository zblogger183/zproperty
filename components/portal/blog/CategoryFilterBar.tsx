import Link from "next/link";

export interface CategoryFilterBarCategory {
  id: string;
  name: string;
  slug: string;
}

export function CategoryFilterBar({
  categories,
  activeSlug,
}: {
  categories: CategoryFilterBarCategory[];
  activeSlug?: string;
}) {
  const allActive = !activeSlug;

  return (
    <div className="sticky top-14 z-30 flex gap-2 overflow-x-auto border-b border-primary bg-white px-6 py-3">
      <Link
        href="/blog"
        className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
          allActive ? "bg-secondary font-bold text-primary" : "border border-primary bg-white text-primary"
        }`}
      >
        All
      </Link>
      {categories.map((category) => {
        const isActive = category.slug === activeSlug;
        return (
          <Link
            key={category.id}
            href={`/blog/category/${category.slug}`}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
              isActive ? "bg-secondary font-bold text-primary" : "border border-primary bg-white text-primary"
            }`}
          >
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
