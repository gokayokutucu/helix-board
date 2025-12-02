import { useCallback, useEffect, useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ImageNode } from './nodes/ImageNode';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { $createParagraphNode, $getRoot } from 'lexical';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import ExampleTheme from './themes/ExampleTheme';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { ListMaxIndentLevelPlugin } from './plugins/ListMaxIndentLevelPlugin';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { ReadOnlyPlugin } from './plugins/ReadOnlyPlugin';
import { AutoLinkPluginWrapper } from './plugins/AutoLinkPlugin';
import { OnChangeMarkdown } from './plugins/OnChangeMarkdown';
import { ImagesPlugin } from './plugins/ImagesPlugin';

import './editor.css';

type TaskDescriptionEditorProps = {
  value?: string | null;
  onChange: (markdown: string) => void;
  isDisabled?: boolean;
};

function Placeholder() {
  return <div className="editor-placeholder">Add a description...</div>;
}

export function TaskDescriptionEditor({ value, onChange, isDisabled = false }: TaskDescriptionEditorProps) {
  const editorConfig = useMemo(
    () => ({
      namespace: 'task-description',
      theme: ExampleTheme,
      onError(error: Error) {
        console.error(error);
      },
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        ImageNode,
        AutoLinkNode,
        LinkNode,
      ],
    }),
    []
  );

  const lastFromEditor = useRef<string | null>(null);
  const handleChange = useCallback(
    (markdown: string) => {
      lastFromEditor.current = markdown;
      onChange(markdown);
    },
    [onChange]
  );

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="lexical-editor">
        <div className="editor-container shadow-sm">
          <ToolbarPlugin />
          <div className="editor-inner">
            <MarkdownValuePlugin value={value} lastFromEditor={lastFromEditor} />
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />

            <HistoryPlugin />

            <CodeHighlightPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <TablePlugin />
            <LinkPlugin />
            <OnChangeMarkdown onChange={handleChange} transformers={TRANSFORMERS} />
            <ReadOnlyPlugin isDisabled={isDisabled} />
            <AutoLinkPluginWrapper />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <ImagesPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}

function normalizeMarkdown(rawValue: string) {
  let str = rawValue.replace(/\n\n<br>\n/g, '\n');

  if (str.match(/<br>/g)) {
    str = str.replace(/^(\n)(?=\s*[-+\d.])/gm, '').replace(/<br>/g, '');
  }

  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function MarkdownValuePlugin({
  value,
  lastFromEditor,
}: {
  value?: string | null;
  lastFromEditor: React.MutableRefObject<string | null>;
}) {
  const [editor] = useLexicalComposerContext();
  const lastApplied = useRef<string | null>(null);

  const incoming = value ?? '';

  useEffect(() => {
    if (incoming === lastFromEditor.current || incoming === lastApplied.current) {
      return;
    }

    const normalized = normalizeMarkdown(incoming);
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      if (!normalized) {
        root.append($createParagraphNode());
        return;
      }
      $convertFromMarkdownString(normalized, TRANSFORMERS);
    });
    lastApplied.current = incoming;
  }, [editor, incoming, lastFromEditor]);

  return null;
}
