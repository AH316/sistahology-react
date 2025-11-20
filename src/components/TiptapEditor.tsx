import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Italic, List, ListOrdered, Code, Type,
  Heading1, Heading2, Heading3
} from 'lucide-react';
import { sanitizeHtml } from '../utils/sanitize';

export interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(sanitizeHtml(html));
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[350px] px-4 py-3',
        'aria-label': 'Content editor',
        'data-placeholder': placeholder,
      },
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }> = ({ onClick, isActive, children, title }) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-2 rounded hover:bg-white/20 transition-colors ${
        isActive ? 'bg-white/30' : ''
      }`}
      title={title}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar with Sistahology pink gradient */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-500 p-2 flex flex-wrap gap-1 items-center">
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-5 h-5 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-5 h-5 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-5 h-5 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Paragraph"
          >
            <Type className="w-5 h-5 text-white" />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-white/30 mx-1" />

        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-5 h-5 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-5 h-5 text-white" />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-white/30 mx-1" />

        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-5 h-5 text-white" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-5 h-5 text-white" />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-white/30 mx-1" />

        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code className="w-5 h-5 text-white" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Tiptap Styles */}
      <style>{`
        .tiptap-editor .ProseMirror {
          min-height: 400px;
        }

        .tiptap-editor .ProseMirror p {
          margin-bottom: 1em;
        }

        .tiptap-editor .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }

        .tiptap-editor .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }

        .tiptap-editor .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }

        .tiptap-editor .ProseMirror ul,
        .tiptap-editor .ProseMirror ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }

        .tiptap-editor .ProseMirror ul {
          list-style-type: disc;
        }

        .tiptap-editor .ProseMirror ol {
          list-style-type: decimal;
        }

        .tiptap-editor .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: monospace;
        }

        .tiptap-editor .ProseMirror pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1em;
          border-radius: 0.5em;
          margin-bottom: 1em;
          overflow-x: auto;
        }

        .tiptap-editor .ProseMirror pre code {
          background: none;
          color: inherit;
          padding: 0;
        }

        .tiptap-editor .ProseMirror:focus {
          outline: none;
        }

        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
