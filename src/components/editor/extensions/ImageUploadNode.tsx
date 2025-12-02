import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type Editor, NodeViewWrapper } from '@tiptap/react';
import { UploadCloud } from 'lucide-react';
import { useRef } from 'react';

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 5;

function insertImages(editor: Editor, files: FileList | File[] | null, removeNode?: () => void) {
  if (!files) return;
  Array.from(files)
    .slice(0, MAX_FILES)
    .forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = typeof reader.result === 'string' ? reader.result : '';
        if (src) {
          editor.chain().focus().setImage({ src, alt: file.name }).run();
          removeNode?.();
        }
      };
      reader.readAsDataURL(file);
    });
}

function UploadPlaceholderView({ editor, deleteNode }: { editor: Editor; deleteNode: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <NodeViewWrapper as="div" className="tiptap-image-upload border border-dashed rounded-lg px-4 py-5 text-center text-sm text-slate-600 bg-slate-50/60 hover:bg-slate-50 transition cursor-pointer">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          insertImages(editor, e.dataTransfer.files, deleteNode);
        }}
        data-drag-handle
      >
        <div className="flex flex-col items-center gap-2">
          <UploadCloud className="h-8 w-8 text-indigo-500" />
          <div>
            <span className="font-semibold underline">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-slate-500">
            Maximum {MAX_FILES} files, {MAX_FILE_SIZE_MB}MB each.
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => insertImages(editor, e.target.files, deleteNode)}
        />
      </div>
    </NodeViewWrapper>
  );
}

export const ImageUploadNode = Node.create({
  name: 'imageUploadPlaceholder',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-image-upload-placeholder]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-image-upload-placeholder': 'true' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <UploadPlaceholderView editor={props.editor as Editor} deleteNode={props.deleteNode} />
    ));
  },
});

export function insertImageUploadNode(editor: Editor) {
  editor.chain().focus().insertContent({ type: 'imageUploadPlaceholder' }).run();
}
