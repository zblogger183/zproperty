"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// @tiptap/html isn't installed (checked package.json), so this can't
// generateHTML() server-side — it renders via a read-only, non-editable
// useEditor() instance instead. Trade-off: the article body is entirely
// client-rendered (no SSR'd content, briefly empty until hydration), unlike
// the generateHTML() approach the task's Option A describes. Acceptable
// here since the surrounding page (title, excerpt, metadata, JSON-LD) is
// still server-rendered and crawlable — only the body copy itself waits on
// client JS.
export function TiptapRenderer({ content }: { content: JSONContent | null }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content ?? "",
    editable: false,
    immediatelyRender: false,
  });

  return (
    <>
      <EditorContent editor={editor} className="tiptap-content" />

      <style>{`
        .tiptap-content h2 { color: black; font-weight: 700; font-size: 1.5rem; margin: 2rem 0 0.75rem; }
        .tiptap-content h3 { color: black; font-weight: 700; font-size: 1.25rem; margin: 1.5rem 0 0.5rem; }
        .tiptap-content h4 { color: black; font-weight: 700; font-size: 1.125rem; margin: 1rem 0 0.5rem; }
        .tiptap-content p { color: black; font-size: 1rem; line-height: 1.75; margin-bottom: 1rem; }
        .tiptap-content ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1rem; color: black; }
        .tiptap-content ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1rem; color: black; }
        .tiptap-content li { margin-bottom: 0.25rem; color: black; }
        .tiptap-content blockquote {
          border-left: 4px solid var(--color-secondary);
          padding-left: 1rem;
          color: var(--color-primary-mid);
          font-style: italic;
          margin: 1rem 0;
        }
        .tiptap-content code {
          background: color-mix(in srgb, var(--color-primary-mid) 10%, transparent);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875rem;
          color: var(--color-primary);
        }
        .tiptap-content pre {
          background: var(--color-primary);
          color: var(--color-secondary);
          padding: 1rem;
          border-radius: 12px;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .tiptap-content pre code { background: none; padding: 0; color: inherit; }
        .tiptap-content a { color: var(--color-primary); text-decoration: underline; }
        .tiptap-content a:hover { color: var(--color-primary-mid); }
        .tiptap-content strong { font-weight: 700; color: black; }
        .tiptap-content hr { border-color: var(--color-primary); margin: 2rem 0; }
      `}</style>
    </>
  );
}
