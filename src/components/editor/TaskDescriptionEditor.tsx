import { useEffect, useCallback } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import FileHandler from '@tiptap/extension-file-handler';
// StarterKit already includes doc/paragraph/text/dropcursor

import { TiptapToolbar } from './TiptapToolbar';
import { ImageUploadNode } from './extensions/ImageUploadNode';
import { ImageNode } from './extensions/ImageNode';

type TaskDescriptionEditorProps = {
  value?: string | null;
  onChange: (html: string) => void;
};

export function TaskDescriptionEditor({ value, onChange }: TaskDescriptionEditorProps) {

  const handleFiles = useCallback((currentEditor: Editor | null, files: File[] | null) => {
    if (!currentEditor || !files) return;
    files.slice(0, 3).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = typeof reader.result === 'string' ? reader.result : '';
        if (src) {
          currentEditor.chain().focus().setImage({ src, alt: file.name }).run();
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem,
      Link.configure({ openOnClick: true, autolink: true }),
      ImageNode,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ImageUploadNode,
      FileHandler.configure({
        allowedMimeTypes: ['image/*'],
        onDrop: ({ editor: dropEditor, files }: any) => {
          handleFiles(dropEditor as Editor, Array.from(files));
          return true;
        },
        onPaste: ({ editor: pasteEditor, files }: any) => {
          handleFiles(pasteEditor as Editor, Array.from(files));
          return true;
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm max-w-none focus:outline-none',
        'data-placeholder': 'Add a description...',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== null && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div className="rounded-md border bg-white">
      <TiptapToolbar editor={editor} />
      <div className="px-3 py-2 min-h-[180px] space-y-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
