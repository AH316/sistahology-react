import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import TiptapEditor from './TiptapEditor';

export interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

type EditorStatus = 'loading' | 'tinymce' | 'tiptap' | 'textarea';

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...'
}) => {
  const [editorStatus, setEditorStatus] = useState<EditorStatus>('loading');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start 10-second timeout for TinyMCE initialization
    timeoutRef.current = setTimeout(() => {
      if (editorStatus === 'loading') {
        console.warn('[RichTextEditor] TinyMCE load timeout (10s), falling back to Tiptap editor');
        setEditorStatus('tiptap');
      }
    }, 10000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editorStatus]);

  const handleTinyMCEInit = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setEditorStatus('tinymce');
  };

  const handleEditorChange = (content: string) => {
    // Don't sanitize during typing - only sanitize on save
    onChange(content);
  };


  // TinyMCE Editor (Primary)
  if (editorStatus === 'loading' || editorStatus === 'tinymce') {
    return (
      <div className="rich-text-editor">
        <Editor
          apiKey="1balm4xm4jbjbx2ukj7bjfs0ivhveo00cro20kmeeernvay0"
          value={value}
          onInit={handleTinyMCEInit}
          onEditorChange={handleEditorChange}
          init={{
            height: 400,
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar:
              'formatselect styleselect | bold italic underline | ' +
              'link image | bullist numlist | code | removeformat',
            content_style: `
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
                padding: 12px;
              }
              p { margin: 0 0 1em 0; }
              /* Sistahology pink styles for preview */
              .text-sistah-pink { color: #F472B6; }
              .text-sistah-rose { color: #EC4899; }
              .text-sistah-purple { color: #DB2777; }
              .font-semibold { font-weight: 600; }
              .h-1 { height: 0.25rem; }
              .bg-pink-300 { background-color: #f9a8d4; }
              .bg-pink-400 { background-color: #f472b6; }
              .bg-pink-500 { background-color: #ec4899; }
              .rounded-full { border-radius: 9999px; }
              .my-8 { margin-top: 2rem; margin-bottom: 2rem; }
              .my-6 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
              .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
            `,
            placeholder,
            branding: false,
            promotion: false,
            // Sistahology pink theme
            skin: 'oxide',
            content_css: 'default',
            // Custom colors for Sistahology brand
            color_map: [
              'F472B6', 'Sistahology Pink',
              'EC4899', 'Sistahology Rose',
              'DB2777', 'Sistahology Deep Pink',
              '000000', 'Black',
              '666666', 'Dark Gray',
              '999999', 'Gray',
              'FFFFFF', 'White'
            ],
            // Format dropdown options
            block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3',
            // Styles dropdown with Sistahology pink options
            style_formats: [
              {
                title: 'Headings',
                items: [
                  { title: 'Heading 1', format: 'h1' },
                  { title: 'Heading 2', format: 'h2' },
                  { title: 'Heading 3', format: 'h3' }
                ]
              },
              {
                title: 'Sistahology Styles',
                items: [
                  {
                    title: 'Pink Emphasis',
                    inline: 'span',
                    classes: 'text-sistah-pink font-semibold'
                  },
                  {
                    title: 'Pink Rose',
                    inline: 'span',
                    classes: 'text-sistah-rose font-semibold'
                  },
                  {
                    title: 'Pink Purple',
                    inline: 'span',
                    classes: 'text-sistah-purple font-semibold'
                  },
                  {
                    title: 'Pink Divider Line',
                    block: 'div',
                    classes: 'h-1 bg-pink-300 rounded-full my-8',
                    wrapper: false
                  }
                ]
              }
            ],
            // Preserve custom Tailwind classes
            valid_classes: {
              'span': 'text-sistah-pink text-sistah-rose text-sistah-purple font-semibold font-bold italic underline',
              'div': 'h-1 bg-pink-300 bg-pink-400 bg-pink-500 rounded-full my-8 my-6 my-4 border-t border-b border-white/20 border-pink-300 mt-4 mt-6 mt-8 mb-4 mb-6 mb-8 pt-4 pt-6 pt-8 pb-4 pb-6 pb-8 flex justify-center items-center space-x-4 overflow-hidden',
              'h1': 'text-sistah-pink text-sistah-rose text-sistah-purple',
              'h2': 'text-sistah-pink text-sistah-rose text-sistah-purple',
              'h3': 'text-sistah-pink text-sistah-rose text-sistah-purple',
              'p': 'text-sistah-pink text-sistah-rose text-sistah-purple',
              'strong': 'text-sistah-pink text-sistah-rose text-sistah-purple',
              'em': 'text-sistah-pink text-sistah-rose text-sistah-purple'
            },
            extended_valid_elements: 'span[class|style],div[class|style],svg[*],path[*]',
            verify_html: false,
            // Link settings
            link_default_target: '_blank',
            link_default_protocol: 'https',
            link_assume_external_targets: true,
            // Image settings
            image_advtab: true,
            image_caption: true,
            automatic_uploads: false,
            // Paste settings
            paste_as_text: false,
            paste_webkit_styles: 'all',
            paste_retain_style_properties: 'all',
            // Accessibility
            a11y_advanced_options: true,
            // Performance
            resize: true,
            elementpath: false,
            statusbar: true
          }}
        />
      </div>
    );
  }

  // Tiptap Editor (Fallback)
  if (editorStatus === 'tiptap') {
    return (
      <TiptapEditor
        value={value}
        onChange={handleEditorChange}
        placeholder={placeholder}
      />
    );
  }

  // Plain Textarea (Ultimate Fallback - should never happen)
  return (
    <div className="rich-text-editor textarea-fallback">
      <textarea
        value={value}
        onChange={(e) => handleEditorChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent min-h-[400px] font-mono text-sm"
        aria-label="HTML editor (fallback)"
      />
      <p className="mt-2 text-xs text-gray-600">
        ℹ️ Using plain text editor. You can use HTML tags for formatting.
      </p>
    </div>
  );
};

export default RichTextEditor;
