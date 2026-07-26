"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import { slugify } from "@/lib/utils";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { inputClass } from "@/components/admin/styles";
import { saveBlogPostAction, type BlogPostStatus } from "@/app/admin/content/blog/actions";
import { TiptapEditor } from "./TiptapEditor";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: JSONContent | null;
  cover_url: string | null;
  author_id: string | null;
  category_id: string | null;
  tags: string[];
  status: BlogPostStatus;
  published_at: string | null;
  is_featured: boolean;
  reading_time: number | null;
  meta_title: string | null;
  meta_desc: string | null;
  focus_keyword: string | null;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
}

export interface BlogAuthor {
  id: string;
  name: string;
}

const STATUS_OPTIONS: { value: BlogPostStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

function snapshotOf(fields: Record<string, unknown>): string {
  return JSON.stringify(fields);
}

export function BlogEditorClient({
  post,
  categories,
  authors,
}: {
  post?: BlogPost | null;
  categories: BlogCategory[];
  authors: BlogAuthor[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState(post?.category_id ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<BlogPostStatus>(post?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(toDatetimeLocal(post?.published_at ?? null));
  const [isFeatured, setIsFeatured] = useState(post?.is_featured ?? false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.cover_url ?? null);
  const [authorId, setAuthorId] = useState(post?.author_id ?? authors[0]?.id ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDesc, setMetaDesc] = useState(post?.meta_desc ?? "");
  const [focusKeyword, setFocusKeyword] = useState(post?.focus_keyword ?? "");
  const [seoOpen, setSeoOpen] = useState(false);
  const [content, setContent] = useState<JSONContent | null>(post?.content ?? null);
  const [plainText, setPlainText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derived, not stored: comparing the current field snapshot to the
  // snapshot taken at last successful save avoids a useEffect just to flip
  // an "isDirty" boolean on every keystroke. Kept in state (not a ref) so it
  // can be read during render without tripping react-hooks/refs — it's only
  // ever written from the save handler, never from render or an effect.
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    snapshotOf({
      title,
      slug,
      excerpt,
      categoryId,
      tags,
      status,
      publishedAt,
      isFeatured,
      coverImageUrl,
      authorId,
      metaTitle,
      metaDesc,
      focusKeyword,
      content,
    }),
  );
  const currentSnapshot = snapshotOf({
    title,
    slug,
    excerpt,
    categoryId,
    tags,
    status,
    publishedAt,
    isFeatured,
    coverImageUrl,
    authorId,
    metaTitle,
    metaDesc,
    focusKeyword,
    content,
  });
  const isDirty = currentSnapshot !== savedSnapshot;

  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const primaryLabel = status === "draft" ? "Publish Now" : status === "scheduled" ? "Schedule Post" : "Update";

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function addTag() {
    const value = tagInput.trim().toLowerCase();
    if (value && !tags.includes(value)) {
      setTags((prev) => [...prev, value]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((existing) => existing !== tag));
  }

  async function handleSave(targetStatus: BlogPostStatus) {
    if (!title.trim() || !slug.trim()) {
      setError("Title and slug are required.");
      return;
    }
    if (!authorId) {
      setError("Select an author before saving.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await saveBlogPostAction({
        id: post?.id,
        title,
        slug,
        excerpt: excerpt || null,
        content: content ?? { type: "doc", content: [] },
        cover_url: coverImageUrl,
        author_id: authorId,
        category_id: categoryId || null,
        tags,
        status: targetStatus,
        published_at:
          targetStatus === "scheduled" && publishedAt
            ? new Date(publishedAt).toISOString()
            : (post?.published_at ?? null),
        is_featured: isFeatured,
        reading_time: readingTime,
        meta_title: metaTitle || null,
        meta_desc: metaDesc || null,
        focus_keyword: focusKeyword || null,
      });

      setStatus(targetStatus);
      setSavedSnapshot(currentSnapshot);
      setLastSaved(new Date());

      if (!post?.id) {
        router.replace(`/admin/content/blog/${result.id}`);
      } else {
        router.refresh();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save post.");
    } finally {
      setIsSaving(false);
    }
  }

  const savedIndicator = isDirty
    ? "Unsaved changes"
    : lastSaved
      ? `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
      : post
        ? `Last updated ${formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}`
        : "Not saved yet";

  return (
    <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row">
      <div className="flex-1">
        {error && (
          <p className="mb-4 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-black">
            <span aria-hidden="true">⚠ </span>
            {error}
          </p>
        )}

        <input
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Post title"
          className="w-full border-none bg-transparent text-2xl font-bold text-black outline-none placeholder:text-primary-mid"
        />

        <div className="mt-2 flex items-center gap-1 text-sm text-primary-mid">
          <span>sarzameenz.com/blog/</span>
          <input
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            className="flex-1 border-b border-dashed border-primary bg-transparent text-black outline-none focus:border-secondary"
          />
        </div>

        <div className="mt-6">
          <TiptapEditor
            content={content}
            onChange={(nextContent, text) => {
              setContent(nextContent);
              setPlainText(text);
            }}
          />
          <p className="mt-2 text-xs text-primary-mid">
            {wordCount} words · {readingTime} min read
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-72">
        <section className="rounded-xl border border-primary bg-white p-4">
          <h2 className="text-sm font-bold text-black">Publish</h2>

          <label className="mt-3 block text-xs font-semibold text-primary-mid" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as BlogPostStatus)}
            className={`${inputClass} mt-1`}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {status === "scheduled" && (
            <>
              <label className="mt-3 block text-xs font-semibold text-primary-mid" htmlFor="publishedAt">
                Publish date
              </label>
              <input
                id="publishedAt"
                type="datetime-local"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
                className={`${inputClass} mt-1`}
              />
            </>
          )}

          <label className="mt-3 block text-xs font-semibold text-primary-mid" htmlFor="author">
            Author
          </label>
          <select
            id="author"
            value={authorId}
            onChange={(event) => setAuthorId(event.target.value)}
            className={`${inputClass} mt-1`}
          >
            <option value="">Select author</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary-mid">Featured</span>
            <button
              type="button"
              role="switch"
              aria-checked={isFeatured}
              onClick={() => setIsFeatured((value) => !value)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                isFeatured ? "bg-secondary" : "bg-primary-mid"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  isFeatured ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave("draft")}
              className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave(status === "draft" ? "published" : status)}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary disabled:opacity-60"
            >
              {isSaving ? "Saving..." : primaryLabel}
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-primary-mid">{savedIndicator}</p>
        </section>

        <section className="rounded-xl border border-primary bg-white p-4">
          <h2 className="text-sm font-bold text-black">Cover Image</h2>
          <div className="mt-3">
            <MediaPicker value={coverImageUrl} onChange={setCoverImageUrl} folder="blog" />
          </div>
        </section>

        <section className="rounded-xl border border-primary bg-white p-4">
          <h2 className="text-sm font-bold text-black">Category &amp; Tags</h2>

          <label className="mt-3 block text-xs font-semibold text-primary-mid" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={`${inputClass} mt-1`}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <label className="mt-3 block text-xs font-semibold text-primary-mid" htmlFor="tags">
            Tags
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
          <input
            id="tags"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag, press Enter"
            className={`${inputClass} mt-2`}
          />
        </section>

        <section className="rounded-xl border border-primary bg-white p-4">
          <h2 className="text-sm font-bold text-black">Excerpt</h2>
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value.slice(0, 300))}
            rows={4}
            className={`${inputClass} mt-2 resize-none`}
          />
          <p className="mt-1 text-right text-xs text-primary-mid">{excerpt.length}/300</p>
        </section>

        <section className="rounded-xl border border-primary bg-white p-4">
          <button
            type="button"
            onClick={() => setSeoOpen((value) => !value)}
            className="flex w-full items-center justify-between text-sm font-bold text-black"
          >
            SEO Settings
            {seoOpen ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {seoOpen && (
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-primary-mid" htmlFor="metaTitle">
                    Meta Title
                  </label>
                  <button
                    type="button"
                    onClick={() => setMetaTitle(title.slice(0, 60))}
                    className="text-xs font-semibold text-primary underline"
                  >
                    Auto-fill from title
                  </button>
                </div>
                <input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(event) => setMetaTitle(event.target.value.slice(0, 60))}
                  className={`${inputClass} mt-1`}
                />
                <p className="mt-1 text-right text-xs text-primary-mid">{metaTitle.length}/60</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-primary-mid" htmlFor="metaDesc">
                    Meta Description
                  </label>
                  <button
                    type="button"
                    onClick={() => setMetaDesc(excerpt.slice(0, 160))}
                    className="text-xs font-semibold text-primary underline"
                  >
                    Auto-fill from excerpt
                  </button>
                </div>
                <textarea
                  id="metaDesc"
                  value={metaDesc}
                  onChange={(event) => setMetaDesc(event.target.value.slice(0, 160))}
                  rows={3}
                  className={`${inputClass} mt-1 resize-none`}
                />
                <p className="mt-1 text-right text-xs text-primary-mid">{metaDesc.length}/160</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-primary-mid" htmlFor="focusKeyword">
                  Focus Keyword
                </label>
                <input
                  id="focusKeyword"
                  value={focusKeyword}
                  onChange={(event) => setFocusKeyword(event.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </div>

              <div className="rounded-lg border border-primary p-3">
                <p className="truncate text-xs text-primary-mid">sarzameenz.com/blog/{slug || "post-slug"}</p>
                <p className="mt-1 truncate text-sm font-medium text-primary underline">
                  {metaTitle || title || "Post title"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-primary-mid">
                  {metaDesc || excerpt || "Meta description preview will appear here."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
