import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type EditorState,
  type LexicalEditor,
} from 'lexical';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListNode as ListNodeType, REMOVE_LIST_COMMAND } from '@lexical/list';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import {
  Paperclip,
  AtSign,
  SmilePlus,
  Sparkles,
  CaseUpper,
  List,
  ListOrdered,
  Link2,
  Code,
  Braces,
} from 'lucide-react';
import { ImagesPlugin } from './plugins/ImagesPlugin';
import { ImageNode } from './nodes/ImageNode';

import ExampleTheme from './themes/ExampleTheme';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { AutoLinkPluginWrapper } from './plugins/AutoLinkPlugin';
import { ListMaxIndentLevelPlugin } from './plugins/ListMaxIndentLevelPlugin';
import './editor.css';

type CommentEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

export function CommentEditor({ value, onChange }: CommentEditorProps) {
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const config = useMemo(
    () => ({
      namespace: 'comment-editor',
      theme: ExampleTheme,
      onError(error: Error) {
        console.error(error);
      },
      editable: true,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        AutoLinkNode,
        LinkNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        ImageNode,
      ],
    }),
    []
  );

  const lastFromEditor = useRef<string | null>(null);

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        lastFromEditor.current = html;
        onChange(html);
      });
    },
    [onChange]
  );

  return (
    <LexicalComposer key={value ? value.length : 'comment-editor'} initialConfig={config}>
      <div className="lexical-editor border border-slate-200 rounded-xl bg-slate-50/90 px-3 py-2 shadow-sm">
        <div className="editor-container border-none bg-transparent shadow-none">
          <div className="editor-inner bg-transparent relative">
            <InlineFormatToolbar open={toolbarOpen} onClose={() => setToolbarOpen(false)} />
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="editor-input min-h-[64px] max-h-52 overflow-auto bg-transparent text-sm"
                  aria-placeholder="Add a comment..."
                  placeholder={<Placeholder />}
                />
              }
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <TablePlugin />
            <LinkPlugin />
            <AutoLinkPluginWrapper />
            <ListMaxIndentLevelPlugin maxDepth={5} />
            <CodeHighlightPlugin />
            <OnChangePlugin onChange={handleChange} />
            <ResetOnClear value={value} lastFromEditor={lastFromEditor} />
            <InitialHtml value={value} lastFromEditor={lastFromEditor} />
            <ImagesPlugin />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-slate-500">
          <IconButton icon={<Paperclip className="h-4 w-4" />} label="Attach" />
          <IconButton icon={<AtSign className="h-4 w-4" />} label="Mention" />
          <IconButton icon={<SmilePlus className="h-4 w-4" />} label="Emoji" />
          <IconButton
            icon={<CaseUpper className="h-4 w-4" />}
            label="Formatting"
            active={toolbarOpen}
            onClick={() => setToolbarOpen((prev) => !prev)}
          />
          <IconButton icon={<Sparkles className="h-4 w-4" />} label="Quick actions" />
        </div>
      </div>
    </LexicalComposer>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-full border border-transparent hover:border-slate-200 hover:bg-white transition text-slate-500 ${
        active ? 'bg-white border-slate-200 shadow-sm text-slate-700' : ''
      }`}
    >
      {icon}
    </button>
  );
}

function Placeholder() {
  return <div className="editor-placeholder text-sm">Add a comment...</div>;
}

function InlineFormatToolbar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNodeType);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = element.getType();
          setBlockType($isCodeNode(element) ? 'code' : type);
        }
      }

      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsStrike(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateToolbar());
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        1
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        1
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        1
      )
    );
  }, [editor, updateToolbar]);

  const toggleLink = useCallback(() => {
    const url = window.prompt('Enter URL');
    if (url === null) return;
    const trimmed = url.trim();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed === '' ? null : trimmed);
  }, [editor]);

  const toggleCodeBlock = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (blockType === 'code') {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }
      $setBlocksType(selection, () => $createCodeNode());
    });
  }, [blockType, editor]);

  if (!open) return null;

  return (
    <div className="absolute -top-12 left-0 z-10 flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-lg">
      <ToolbarButton
        ariaLabel="Undo"
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        ↺
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Redo"
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        ↻
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        ariaLabel="Bold"
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Italic"
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Strikethrough"
        active={isStrike}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
      >
        <span className="line-through">S</span>
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        ariaLabel="Numbered list"
        active={blockType === 'ol'}
        onClick={() =>
          blockType === 'ol'
            ? editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
            : editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Bullet list"
        active={blockType === 'ul'}
        onClick={() =>
          blockType === 'ul'
            ? editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
            : editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton ariaLabel="Link" onClick={toggleLink}>
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        ariaLabel="Inline code"
        active={isCode}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton ariaLabel="Code block" active={blockType === 'code'} onClick={toggleCodeBlock}>
        <Braces className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton ariaLabel="Close toolbar" onClick={onClose}>
        ✕
      </ToolbarButton>
    </div>
  );
}

function ToolbarDivider() {
  return <div className="h-6 w-px bg-slate-200" />;
}

function ToolbarButton({
  children,
  ariaLabel,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`h-8 min-w-[32px] px-2 inline-flex items-center justify-center rounded-lg text-sm font-medium text-slate-700 border border-transparent hover:bg-slate-100 ${
        active ? 'bg-slate-100 border-slate-200 shadow-inner' : ''
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function ResetOnClear({
  value,
  lastFromEditor,
}: {
  value: string;
  lastFromEditor: React.MutableRefObject<string | null>;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (value === '') {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      });
    }
  }, [editor, value]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        lastFromEditor.current = html;
      });
    });
  }, [editor, lastFromEditor]);
  return null;
}

function InitialHtml({
  value,
  lastFromEditor,
}: {
  value: string;
  lastFromEditor: React.MutableRefObject<string | null>;
}) {
  const [editor] = useLexicalComposerContext();
  const lastApplied = useRef<string | null>(null);

  useEffect(() => {
    if (!value || value === lastApplied.current || value === lastFromEditor.current) return;
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const parser = new DOMParser();
      const dom = parser.parseFromString(value, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      if (nodes.length === 0) {
        root.append($createParagraphNode());
      } else {
        nodes.forEach((node) => root.append(node));
      }
    });
    lastApplied.current = value;
  }, [editor, lastFromEditor, value]);

  return null;
}
