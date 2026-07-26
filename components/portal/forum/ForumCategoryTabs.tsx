"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FORUM_CATEGORIES } from "@/lib/constants/forumCategories";

export function ForumCategoryTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";

  function selectCategory(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("category", value);
    else next.delete("category");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-primary bg-white px-6 py-3">
      {FORUM_CATEGORIES.map((category) => (
        <button
          key={category.value}
          type="button"
          onClick={() => selectCategory(category.value)}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
            activeCategory === category.value
              ? "bg-secondary font-bold text-primary"
              : "border border-primary bg-white text-primary"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
