import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isRangeSelection,
  type LexicalCommand,
  type TextFormatType,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';

const buttonBase =
  'px-2 py-1 text-xs rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition';
const activeClass = 'bg-gray-100 border-gray-300';

export function MinimalToolbar() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateToolbar]);

  const format = useCallback(
    (type: TextFormatType) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type),
    [editor]
  );

  const toggleLink = useCallback(() => {
    const url = window.prompt('Enter URL');
    if (url === null) return;
    const trimmed = url.trim();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed === '' ? null : trimmed);
  }, [editor]);

  const insertList = useCallback(
    (command: LexicalCommand<void>) => editor.dispatchCommand(command, undefined),
    [editor]
  );

  const align = useCallback(
    (value: 'left' | 'center' | 'right' | 'justify') =>
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value),
    [editor]
  );

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <button
        type="button"
        className={buttonBase}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
      >
        Undo
      </button>
      <button
        type="button"
        className={buttonBase}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
      >
        Redo
      </button>
      <button
        type="button"
        className={`${buttonBase} ${isBold ? activeClass : ''}`}
        onClick={() => format('bold')}
      >
        Bold
      </button>
      <button
        type="button"
        className={`${buttonBase} ${isItalic ? activeClass : ''}`}
        onClick={() => format('italic')}
      >
        Italic
      </button>
      <button
        type="button"
        className={`${buttonBase} ${isUnderline ? activeClass : ''}`}
        onClick={() => format('underline')}
      >
        Underline
      </button>
      <button
        type="button"
        className={`${buttonBase} ${isStrikethrough ? activeClass : ''}`}
        onClick={() => format('strikethrough')}
      >
        Strike
      </button>
      <button type="button" className={buttonBase} onClick={() => format('code')}>
        Code
      </button>
      <button type="button" className={buttonBase} onClick={() => insertList(INSERT_UNORDERED_LIST_COMMAND)}>
        Bullet
      </button>
      <button type="button" className={buttonBase} onClick={() => insertList(INSERT_ORDERED_LIST_COMMAND)}>
        Numbered
      </button>
      <button type="button" className={buttonBase} onClick={() => insertList(REMOVE_LIST_COMMAND)}>
        Clear list
      </button>
      <button type="button" className={buttonBase} onClick={toggleLink}>
        Link
      </button>
      <button type="button" className={buttonBase} onClick={() => align('left')}>
        Left
      </button>
      <button type="button" className={buttonBase} onClick={() => align('center')}>
        Center
      </button>
      <button type="button" className={buttonBase} onClick={() => align('right')}>
        Right
      </button>
      <button type="button" className={buttonBase} onClick={() => align('justify')}>
        Justify
      </button>
    </div>
  );
}
