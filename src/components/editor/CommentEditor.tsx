import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Button } from '../ui/button';
import { useEffect } from 'react';

type CommentEditorProps = {
  onSubmit: (html: string) => void;
};

export function CommentEditor({ onSubmit }: CommentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'tiptap prose prose-sm max-w-none focus:outline-none min-h-[40px] px-3 py-2 border rounded-md bg-white',
        'data-placeholder': 'Add comment',
      },
    },
  });

  const handleSubmit = () => {
    if (!editor) return;
    const html = editor.getHTML();
    onSubmit(html);
    editor.commands.clearContent();
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleSubmit]);

  return (
    <div className="space-y-2">
      <EditorContent editor={editor} />
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit}>
          Comment
        </Button>
      </div>
    </div>
  );
}
