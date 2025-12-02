import type { Dispatch, SetStateAction } from 'react';
import type { EditorState } from 'lexical';
import { useEffect, useRef } from 'react';
import { $convertToMarkdownString, type Transformer } from '@lexical/markdown';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';

export type OnChangeMarkdownType =
  | Dispatch<SetStateAction<string>>
  | ((value: string) => void);

export function OnChangeMarkdown({
  onChange,
  transformers,
  __UNSAFE_debounceTime,
}: {
  transformers: ReadonlyArray<Transformer>;
  onChange: OnChangeMarkdownType;
  __UNSAFE_debounceTime?: number;
}) {
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (state: EditorState) => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(
      () => transformState(state, onChange, transformers),
      __UNSAFE_debounceTime ?? 200
    );
  };

  return (
    <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
  );
}

function transformState(
  editorState: EditorState,
  onChange: OnChangeMarkdownType,
  transformers: ReadonlyArray<Transformer>
) {
  editorState.read(() => {
    const markdown = $convertToMarkdownString(transformers as Transformer[]);
    const withBrs = markdown
      .replace(/\n(?=\n)/g, '\n\n<br>\n')
      .replace(/^(&gt;)(?=\s)(?!.*&lt;)/gm, '>');
    onChange(withBrs);
  });
}
