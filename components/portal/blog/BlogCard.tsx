import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

export interface BlogCardPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  og_image_url: string | null;
  published_at: string | null;
  reading_time: number | null;
  views_count: number;
  category: { name: string; slug: string } | null;
  author: { name: string } | null;
}

export function BlogCard({ post }: { post: BlogCardPost }) {
  const authorName = post.author?.name ?? "SarZameenz Team";
  const image = post.cover_url ?? post.og_image_url;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block cursor-pointer overflow-hidden rounded-xl border border-primary bg-white transition hover:border-2 hover:border-secondary"
    >
      <div className="relative aspect-video overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-primary-mid">
            <span className="text-2xl font-bold text-white">{post.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
        {post.category && (
          <span className="absolute left-3 top-3 rounded bg-primary px-2 py-1 text-[10px] font-bold text-white">
            {post.category.name}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-black">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-primary-mid">{post.excerpt}</p>}

        <div className="mt-3 flex items-center gap-2 text-xs text-primary-mid">
          <span>{authorName}</span>
          {post.reading_time != null && (
            <>
              <span>·</span>
              <span>{post.reading_time} min</span>
            </>
          )}
          {post.published_at && (
            <>
              <span>·</span>
              <span>{format(new Date(post.published_at), "MMM d")}</span>
            </>
          )}
        </div>

        <p className="mt-2 text-xs font-semibold text-primary hover:text-primary-mid">Read more →</p>
      </div>
    </Link>
  );
}
