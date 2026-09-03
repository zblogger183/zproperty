import Link from "next/link";
import { BlogCard, type BlogCardPost } from "../blog/BlogCard";

export function LatestBlogSection({ posts }: { posts: BlogCardPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-primary bg-white px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-black">Latest from the Blog</h2>
          <Link href="/blog" className="text-sm text-primary transition hover:text-primary-mid">
            View all →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
