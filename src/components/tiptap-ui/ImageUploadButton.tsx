import type { Editor } from '@tiptap/react';
import { Button } from '../ui/button';
import { Image as ImageIcon } from 'lucide-react';

type ImageUploadButtonProps = {
  editor: Editor | null;
  text?: string;
  onInserted?: () => void;
};

export function ImageUploadButton({ editor, text = 'Add Image', onInserted }: ImageUploadButtonProps) {
  if (!editor) return null;

  const handleClick = () => {
    editor.chain().focus().insertContent({ type: 'imageUploadPlaceholder' }).run();
    onInserted?.();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={handleClick}
      disabled={!editor.isEditable}
    >
      <ImageIcon className="h-4 w-4" />
      {text}
    </Button>
  );
}
