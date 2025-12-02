import {
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  type ChangeEvent,
} from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Paperclip, Smile, AtSign, Type, Sparkles } from 'lucide-react';

type CommentEditorProps = {
  onSubmit: (html: string) => void;
};

type MentionUser = {
  id: string;
  label: string;
  username: string;
};

const mentionUsers: MentionUser[] = [
  { id: '1', label: 'Jane Doe', username: 'jane' },
  { id: '2', label: 'Alex Lee', username: 'alex' },
  { id: '3', label: 'Jordan Smith', username: 'jsmith' },
  { id: '4', label: 'Taylor Kim', username: 'tkim' },
  { id: '5', label: 'Sam Carter', username: 'scarter' },
];

const createMentionSuggestion = () => {
  return {
    char: '@',
    items: ({ query }: { query: string }) =>
      mentionUsers
        .filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.username.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5),
    render: () => {
      let component: ReactRenderer | null = null;
      let popup: HTMLElement | null = null;

      return {
        onStart: (props: SuggestionProps) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          popup = document.createElement('div');
          popup.className = 'mention-dropdown';
          popup.appendChild(component.element);

          Object.assign(popup.style, {
            position: 'absolute',
            zIndex: '50',
          });

          document.body.appendChild(popup);
          positionPopup(popup, props.clientRect ? props.clientRect() : null);
        },
        onUpdate(props: SuggestionProps) {
          component?.updateProps(props);
          if (popup) {
            positionPopup(popup, props.clientRect ? props.clientRect() : null);
          }
        },
        onKeyDown(props: SuggestionKeyDownProps) {
          if (component?.ref) {
            return (component.ref as MentionListHandle).onKeyDown(props);
          }
          return false;
        },
        onExit() {
          if (popup) {
            popup.remove();
          }
          if (component) {
            component.destroy();
          }
        },
      };
    },
  };
};

const positionPopup = (popup: HTMLElement, clientRect?: DOMRect | null) => {
  if (!popup) return;
  if (!clientRect) {
    popup.style.visibility = 'hidden';
    return;
  }
  popup.style.visibility = 'visible';
  popup.style.left = `${clientRect.left + window.scrollX}px`;
  popup.style.top = `${clientRect.bottom + window.scrollY + 4}px`;
};

type MentionListHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

const MentionList = forwardRef<MentionListHandle, { items: MentionUser[]; command: (item: MentionUser) => void }>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (!items.length) return false;

        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          event.preventDefault();
          return true;
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          event.preventDefault();
          return true;
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          event.preventDefault();
          return true;
        }

        return false;
      },
    }));

  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-md py-1 min-w-[180px] text-sm">
      {items.length ? (
        items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${
              index === selectedIndex ? 'bg-slate-50' : ''
            }`}
            onMouseEnter={() => {
              setSelectedIndex(index);
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              selectItem(index);
            }}
          >
            <span className="font-medium text-slate-800">{item.label}</span>
            <span className="text-slate-500 text-xs ml-2">@{item.username}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-slate-500">No matches</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';

export function CommentEditor({ onSubmit }: CommentEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiList = ['😀', '😅', '😍', '🤔', '🙌'];

  const mentionSuggestion = useMemo(() => createMentionSuggestion(), []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Mention.configure({
        HTMLAttributes: { class: 'mention text-indigo-600 font-semibold' },
        suggestion: mentionSuggestion,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm max-w-none focus:outline-none min-h-[80px]',
        'data-placeholder': 'Add a comment...',
      },
    },
  });

  const handleSend = () => {
    if (!editor) return;
    const html = editor.getHTML();
    if (html === '<p></p>' || html.trim() === '') return;
    onSubmit(html);
    editor.commands.setContent('');
    editor.commands.focus();
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected attachment', file);
    }
    event.target.value = '';
  };

  const insertEmoji = (emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
  };

  const triggerMention = () => {
    if (!editor) return;
    editor.chain().focus().insertContent('@').run();
  };

  const handleAI = () => {
    console.log('AI assist clicked');
    if (!editor) return;
    const html = editor.getHTML();
    if (html === '<p></p>' || html.trim() === '') {
      editor.commands.setContent('Draft comment generated by AI…');
    } else {
      editor.chain().focus().insertContent(' ✨').run();
    }
    editor.commands.focus();
  };

  const isEmpty = !editor || editor.isEmpty || editor.getText().trim() === '';

  if (!editor) return null;

  return (
    <div className="rounded-lg border bg-slate-50 px-3 py-2 shadow-sm">
      <EditorContent editor={editor} />

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAttachmentClick}>
            <Paperclip className="h-4 w-4 text-slate-600" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Smile className="h-4 w-4 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="grid grid-cols-5 gap-1 p-2">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  className="text-xl hover:bg-slate-100 rounded-md p-1"
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={triggerMention}>
            <AtSign className="h-4 w-4 text-slate-600" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Type className="h-4 w-4 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6}>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  editor.chain().focus().toggleBold().run();
                }}
              >
                Bold
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  editor.chain().focus().toggleItalic().run();
                }}
              >
                Italic
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  editor.chain().focus().toggleUnderline().run();
                }}
              >
                Underline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAI}>
            <Sparkles className="h-4 w-4 text-slate-600" />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={handleSend} disabled={isEmpty}>
          Send
        </Button>
      </div>
    </div>
  );
}
