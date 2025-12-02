import type { Editor } from '@tiptap/react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ListChecks,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  Undo2,
  Redo2,
  Heading,
  Eraser,
} from 'lucide-react';

type TiptapToolbarProps = {
  editor: Editor | null;
};

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  if (!editor) return null;

  const disabled = !editor.isEditable;

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertImage = () => {
    editor.chain().focus().insertContent({ type: 'imageUploadPlaceholder' }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-slate-50 px-2 py-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled} className="gap-1">
            <Heading className="h-4 w-4" />
            H
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>
            Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            Heading 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarButton
        icon={<Bold className="h-4 w-4" />}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        label="Bold"
      />
      <ToolbarButton
        icon={<Italic className="h-4 w-4" />}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        label="Italic"
      />
      <ToolbarButton
        icon={<Underline className="h-4 w-4" />}
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={disabled}
        label="Underline"
      />
      <ToolbarButton
        icon={<Strikethrough className="h-4 w-4" />}
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
        label="Strike"
      />

      <ToolbarButton
        icon={<ListChecks className="h-4 w-4" />}
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        disabled={disabled}
        label="Task list"
      />
      <ToolbarButton
        icon={<List className="h-4 w-4" />}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
        label="Bullet list"
      />
      <ToolbarButton
        icon={<ListOrdered className="h-4 w-4" />}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
        label="Ordered list"
      />

      <ToolbarButton
        icon={<AlignLeft className="h-4 w-4" />}
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        disabled={disabled}
        label="Align left"
      />
      <ToolbarButton
        icon={<AlignCenter className="h-4 w-4" />}
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        disabled={disabled}
        label="Align center"
      />
      <ToolbarButton
        icon={<AlignRight className="h-4 w-4" />}
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        disabled={disabled}
        label="Align right"
      />
      <ToolbarButton
        icon={<AlignJustify className="h-4 w-4" />}
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        disabled={disabled}
        label="Align justify"
      />

      <ToolbarButton
        icon={<LinkIcon className="h-4 w-4" />}
        active={editor.isActive('link')}
        onClick={toggleLink}
        disabled={disabled}
        label="Link"
      />
      <ToolbarButton
        icon={<ImageIcon className="h-4 w-4" />}
        active={false}
        onClick={insertImage}
        disabled={disabled}
        label="Image"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled} className="gap-1">
            <TableIcon className="h-4 w-4" />
            Table
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={insertTable}>Insert table</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().addRowBefore().run()}>
            Add row before
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().addRowAfter().run()}>
            Add row after
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnBefore().run()}>
            Add column before
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnAfter().run()}>
            Add column after
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().deleteRow().run()}>
            Delete row
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().deleteColumn().run()}>
            Delete column
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().deleteTable().run()}>
            Delete table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarButton
        icon={<Highlighter className="h-4 w-4" />}
        active={editor.isActive('highlight')}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        disabled={disabled}
        label="Highlight"
      />

      <ToolbarButton
        icon={<Undo2 className="h-4 w-4" />}
        active={false}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled}
        label="Undo"
      />
      <ToolbarButton
        icon={<Redo2 className="h-4 w-4" />}
        active={false}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled}
        label="Redo"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled}>
            <Eraser className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onSelect={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            Clear formatting
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().undo().run()}>
            Undo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().redo().run()}>
            Redo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ToolbarButton({
  icon,
  active,
  onClick,
  disabled,
  label,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className="h-8 w-8 p-0"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}
    </Button>
  );
}
