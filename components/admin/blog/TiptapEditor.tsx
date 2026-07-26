"use client";

import { useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code2, RemoveFormatting } from "lucide-react";

// @tiptap/extension-link is not installed (checked package.json per the
// task's own instruction), and StarterKit does not include link support by
// default in this version — the Link toolbar button is intentionally
// omitted rather than shipping a non-functional button. Add
// @tiptap/extension-link and wire up editor.chain().focus().setLink(...) to
// restore it.
//
// Same reasoning for the placeholder: the usual `is-editor-empty` CSS trick
// is added by @tiptap/extension-placeholder, which also isn't installed.
// Tracking emptiness in React state and rendering a plain overlay avoids
// needing it.

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: {
  content: JSONContent | null;
  onChange: (content: JSONContent, text: string) => void;
  placeholder?: string;
}) {
  const [isEmpty, setIsEmpty] = useState(true);

  const editor = useEditor({
    extensions: [StarterKit],
    content: content ?? "",
    immediatelyRender: false,
    onCreate: ({ editor: instance }) => {
      setIsEmpty(instance.isEmpty);
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getJSON(), instance.getText());
      setIsEmpty(instance.isEmpty);
    },
  });

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-primary bg-white px-3 py-2">
        <ToolbarButton
          active={editor?.isActive("heading", { level: 2 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          label="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("heading", { level: 3 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          label="Heading 3"
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("heading", { level: 4 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
          label="Heading 4"
        >
          H4
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor?.isActive("bold") ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("italic") ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("strike") ?? false}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          label="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor?.isActive("bulletList") ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        >
          <List className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("orderedList") ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          label="Numbered list"
        >
          <ListOrdered className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("blockquote") ?? false}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          label="Blockquote"
        >
          <Quote className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("codeBlock") ?? false}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          label="Code block"
        >
          <Code2 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={false}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          label="Horizontal rule"
        >
          —
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          label="Clear formatting"
        >
          <RemoveFormatting className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
      </div>

      <div className="tiptap-editor-shell relative rounded-b-lg border border-t-0 border-primary px-4 py-3">
        {isEmpty && (
          <p className="pointer-events-none absolute text-sm italic text-primary-mid" aria-hidden="true">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .tiptap-editor-shell .ProseMirror { outline: none; min-height: 400px; }
        .tiptap-editor-shell .ProseMirror h2 { font-size: 1.4rem; font-weight: 700; color: black; margin: 1rem 0 0.5rem; }
        .tiptap-editor-shell .ProseMirror h3 { font-size: 1.2rem; font-weight: 700; color: black; margin: 0.8rem 0 0.4rem; }
        .tiptap-editor-shell .ProseMirror h4 { font-size: 1.05rem; font-weight: 700; color: black; margin: 0.7rem 0 0.35rem; }
        .tiptap-editor-shell .ProseMirror p { margin: 0.5rem 0; color: black; font-size: 0.875rem; line-height: 1.6; }
        .tiptap-editor-shell .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .tiptap-editor-shell .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .tiptap-editor-shell .ProseMirror blockquote { border-left: 4px solid #1C4B42; padding-left: 1rem; color: #2A6B5F; margin: 1rem 0; }
        .tiptap-editor-shell .ProseMirror code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; }
        .tiptap-editor-shell .ProseMirror pre { background: #1C4B42; color: #B4E717; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        .tiptap-editor-shell .ProseMirror pre code { background: none; padding: 0; }
        .tiptap-editor-shell .ProseMirror a { color: #1C4B42; text-decoration: underline; }
      `}</style>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-primary" aria-hidden="true" />;
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`cursor-pointer rounded p-1.5 text-sm transition ${
        active ? "bg-primary text-white" : "text-black hover:bg-primary hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
