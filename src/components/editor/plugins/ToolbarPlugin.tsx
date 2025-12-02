import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $wrapNodes, $isAtNodeEnd } from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { createPortal } from 'react-dom';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text';
import { $createCodeNode, $isCodeNode, getDefaultCodeLanguage, getCodeLanguages } from '@lexical/code';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { Highlighter, Image as ImageIcon, ListChecks, Table2 } from 'lucide-react';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';

const LowPriority = 1;

const supportedBlockTypes = new Set(['paragraph', 'quote', 'code', 'h1', 'h2', 'bullet', 'number', 'check']);

const blockTypeToBlockName: Record<string, string> = {
  code: 'Code Block',
  h1: 'Large Heading',
  h2: 'Small Heading',
  h3: 'Heading',
  h4: 'Heading',
  h5: 'Heading',
  number: 'Numbered List',
  bullet: 'Bulleted List',
  check: 'Check List',
  paragraph: 'Normal',
  quote: 'Quote',
};

function Divider() {
  return <div className="divider" />;
}

function positionEditorElement(editor: HTMLElement, rect: DOMRect | null) {
  if (rect === null) {
    editor.style.opacity = '0';
    editor.style.top = '-1000px';
    editor.style.left = '-1000px';
  } else {
    editor.style.opacity = '1';
    editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
    editor.style.left = `${rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2}px`;
  }
}

function FloatingLinkEditor({ editor }: { editor: ReturnType<typeof useLexicalComposerContext>[0] }) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mouseDownRef = useRef(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isEditMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState<any>(null);

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl('');
      }
    }
    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (editorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const domRange = nativeSelection.getRangeAt(0);
      let rect: DOMRect | undefined;
      if (nativeSelection.anchorNode === rootElement) {
        let inner: Element | null = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild;
        }
        rect = inner?.getBoundingClientRect();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      if (!mouseDownRef.current && rect) {
        positionEditorElement(editorElem, rect);
      }
      setLastSelection(selection);
    } else if (!activeElement || (activeElement as HTMLElement).className !== 'link-input') {
      positionEditorElement(editorElem, null);
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl('');
    }

    return true;
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        LowPriority
      )
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  return (
    <div ref={editorRef} className="link-editor lexical-link-editor">
      {isEditMode ? (
        <input
          ref={inputRef}
          className="link-input"
          value={linkUrl}
          onChange={(event) => {
            setLinkUrl(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (lastSelection !== null) {
                if (linkUrl !== '') {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
                }
                setEditMode(false);
              }
            } else if (event.key === 'Escape') {
              event.preventDefault();
              setEditMode(false);
            }
          }}
        />
      ) : (
        <>
          <div className="link-input">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              {linkUrl}
            </a>
            <div
              className="link-edit"
              role="button"
              tabIndex={0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setEditMode(true);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Select({
  onChange,
  className,
  options,
  value,
}: {
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  className: string;
  options: string[];
  value: string;
}) {
  return (
    <select className={className} onChange={onChange} value={value}>
      <option hidden value="" />
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function getSelectedNode(selection: any) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  }
  return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
}

function BlockOptionsDropdownList({
  editor,
  blockType,
  toolbarRef,
  setShowBlockOptionsDropDown,
  blockButtonRef,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
  blockType: string;
  toolbarRef: React.RefObject<HTMLDivElement>;
  blockButtonRef: React.RefObject<HTMLButtonElement>;
  setShowBlockOptionsDropDown: (open: boolean) => void;
}) {
  const dropDownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const blockButton = blockButtonRef.current;
    const dropDown = dropDownRef.current;

    if (blockButton !== null && dropDown !== null) {
      const rect = blockButton.getBoundingClientRect();
      dropDown.style.top = `${rect.bottom + window.pageYOffset + 8}px`;
      dropDown.style.left = `${rect.left + window.pageXOffset}px`;
    }
  }, [blockButtonRef, dropDownRef]);

  useEffect(() => {
    const dropDown = dropDownRef.current;
    const toolbar = toolbarRef.current;

    if (dropDown !== null && toolbar !== null) {
      const handle = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        if (!dropDown.contains(target) && !toolbar.contains(target)) {
          setShowBlockOptionsDropDown(false);
        }
      };
      document.addEventListener('click', handle);

      return () => {
        document.removeEventListener('click', handle);
      };
    }
  }, [dropDownRef, setShowBlockOptionsDropDown, toolbarRef]);

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatLargeHeading = () => {
    if (blockType !== 'h1') {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode('h1'));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatSmallHeading = () => {
    if (blockType !== 'h2') {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode('h2'));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatCheckList = () => {
    if (blockType !== 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createCodeNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  return (
    <div className="dropdown lexical-dropdown" ref={dropDownRef}>
      <button className="item" onClick={formatParagraph} type="button">
        <span className="icon paragraph" />
        <span className="text">Normal</span>
        {blockType === 'paragraph' && <span className="active" />}
      </button>
      <button className="item" onClick={formatLargeHeading} type="button">
        <span className="icon large-heading" />
        <span className="text">Large Heading</span>
        {blockType === 'h1' && <span className="active" />}
      </button>
      <button className="item" onClick={formatSmallHeading} type="button">
        <span className="icon small-heading" />
        <span className="text">Small Heading</span>
        {blockType === 'h2' && <span className="active" />}
      </button>
      <button className="item" onClick={formatBulletList} type="button">
        <span className="icon bullet-list" />
        <span className="text">Bullet List</span>
        {blockType === 'bullet' && <span className="active" />}
      </button>
      <button className="item" onClick={formatNumberedList} type="button">
        <span className="icon numbered-list" />
        <span className="text">Numbered List</span>
        {blockType === 'number' && <span className="active" />}
      </button>
      <button className="item" onClick={formatCheckList} type="button">
        <span className="icon check" />
        <span className="text">Check List</span>
        {blockType === 'check' && <span className="active" />}
      </button>
      <button className="item" onClick={formatQuote} type="button">
        <span className="icon quote" />
        <span className="text">Quote</span>
        {blockType === 'quote' && <span className="active" />}
      </button>
      <button className="item" onClick={formatCode} type="button">
        <span className="icon code" />
        <span className="text">Code Block</span>
        {blockType === 'code' && <span className="active" />}
      </button>
    </div>
  );
}

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const blockButtonRef = useRef<HTMLButtonElement | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(null);
  const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('');
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState('3');
  const [tableCols, setTableCols] = useState('3');
  const [imageDialogMode, setImageDialogMode] = useState<'choose' | 'url' | 'file'>('choose');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const listType = parentList ? parentList.getListType() : element.getListType();
          setBlockType(listType);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          setBlockType(type);
          if ($isCodeNode(element)) {
            setCodeLanguage(element.getLanguage() || getDefaultCodeLanguage());
          }
        }
      }
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));
      setIsHighlight(selection.hasFormat('highlight'));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, [editor]);

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
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const codeLanguages = useMemo(() => getCodeLanguages(), []);
  const onCodeLanguageSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      editor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(event.target.value);
          }
        }
      });
    },
    [editor, selectedElementKey]
  );

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  return (
    <div className="toolbar" ref={toolbarRef}>
      <button
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="toolbar-item spaced"
        aria-label="Undo"
        type="button"
      >
        <i className="format undo" />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Redo"
        type="button"
      >
        <i className="format redo" />
      </button>
      <Divider />
      {supportedBlockTypes.has(blockType) && (
        <>
          <button
            ref={blockButtonRef}
            id="block-controls"
            className="toolbar-item block-controls"
            onClick={() => setShowBlockOptionsDropDown(!showBlockOptionsDropDown)}
            aria-label="Formatting Options"
            type="button"
          >
            <span
              className={`icon block-type ${
                blockType === 'bullet' ? 'ul' : blockType === 'number' ? 'ol' : blockType
              }`}
            />
            <span className="text">{blockTypeToBlockName[blockType]}</span>
            <i className="chevron-down" />
          </button>
          {showBlockOptionsDropDown &&
            createPortal(
              <BlockOptionsDropdownList
                editor={editor}
                blockType={blockType}
                toolbarRef={toolbarRef}
                blockButtonRef={blockButtonRef}
                setShowBlockOptionsDropDown={setShowBlockOptionsDropDown}
              />,
              document.body
            )}
          <Divider />
        </>
      )}
      {blockType === 'code' ? (
        <>
          <Select
            className="toolbar-item code-language"
            onChange={onCodeLanguageSelect}
            options={codeLanguages}
            value={codeLanguage}
          />
          <i className="chevron-down inside" />
        </>
      ) : (
        <>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            }}
            className={`toolbar-item spaced ${isBold ? 'active' : ''}`}
            aria-label="Format Bold"
            type="button"
          >
            <i className="format bold" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            }}
            className={`toolbar-item spaced ${isItalic ? 'active' : ''}`}
            aria-label="Format Italics"
            type="button"
          >
            <i className="format italic" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            }}
            className={`toolbar-item spaced ${isUnderline ? 'active' : ''}`}
            aria-label="Format Underline"
            type="button"
          >
            <i className="format underline" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
            }}
            className={`toolbar-item spaced ${isStrikethrough ? 'active' : ''}`}
            aria-label="Format Strikethrough"
            type="button"
          >
            <i className="format strikethrough" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight');
            }}
            className={`toolbar-item spaced ${isHighlight ? 'active' : ''}`}
            aria-label="Highlight"
            type="button"
          >
            <Highlighter className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
            }}
            className={`toolbar-item spaced ${isCode ? 'active' : ''}`}
            aria-label="Insert Code"
            type="button"
          >
            <i className="format code" />
          </button>
          <button
            onClick={insertLink}
            className={`toolbar-item spaced ${isLink ? 'active' : ''}`}
            aria-label="Insert Link"
            type="button"
          >
            <i className="format link" />
          </button>
          {isLink && createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
          <Divider />
          <button
            onClick={() => {
              if (blockType !== 'check') {
                editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
              } else {
                editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
              }
            }}
            className={`toolbar-item spaced ${blockType === 'check' ? 'active' : ''}`}
            aria-label="Check List"
            type="button"
          >
            <ListChecks className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => setShowTableDialog(true)}
            className="toolbar-item spaced"
            aria-label="Insert Table"
            type="button"
          >
            <Table2 className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => setShowImageDialog(true)}
            className="toolbar-item spaced"
            aria-label="Insert Image"
            type="button"
          >
            <ImageIcon className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
            }}
            className="toolbar-item spaced"
            aria-label="Left Align"
            type="button"
          >
            <i className="format left-align" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
            }}
            className="toolbar-item spaced"
            aria-label="Center Align"
            type="button"
          >
            <i className="format center-align" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
            }}
            className="toolbar-item spaced"
            aria-label="Right Align"
            type="button"
          >
            <i className="format right-align" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
            }}
            className="toolbar-item"
            aria-label="Justify Align"
            type="button"
          >
            <i className="format justify-align" />
          </button>
        </>
      )}
      {showImageDialog &&
        createPortal(
          <InsertImageDialog
            mode={imageDialogMode}
            onClose={() => setShowImageDialog(false)}
            onSelectMode={(mode) => setImageDialogMode(mode)}
            onInsert={(payload) => {
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
              setShowImageDialog(false);
              setImageDialogMode('choose');
            }}
          />,
          document.body
        )}
      {showTableDialog &&
        createPortal(
          <InsertTableDialog
            rows={tableRows}
            cols={tableCols}
            onChangeRows={setTableRows}
            onChangeCols={setTableCols}
            onConfirm={() => {
              editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: tableRows, columns: tableCols });
              setShowTableDialog(false);
            }}
            onClose={() => setShowTableDialog(false)}
          />,
          document.body
        )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function InsertImageDialog({
  onInsert,
  onClose,
  onSelectMode,
  mode,
}: {
  onInsert: (payload: { src: string; altText?: string }) => void;
  onClose: () => void;
  onSelectMode: (mode: 'choose' | 'url' | 'file') => void;
  mode: 'choose' | 'url' | 'file';
}) {
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [fileData, setFileData] = useState<{ src: string; name?: string } | null>(null);
  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const dataUrl = await readFileAsDataUrl(files[0]);
    setFileData({ src: dataUrl, name: files[0].name });
    if (!altText) {
      setAltText(files[0].name);
    }
  };

  const renderChooser = () => (
    <div className="lexical-modal-content">
      <button className="lexical-modal-btn" type="button" onClick={() => onSelectMode('url')}>
        URL
      </button>
      <button className="lexical-modal-btn" type="button" onClick={() => onSelectMode('file')}>
        File
      </button>
    </div>
  );

  const renderUrl = () => (
    <div className="lexical-modal-content lexical-modal-grid">
      <label className="lexical-modal-field">
        <span>Image URL</span>
        <input
          type="text"
          value={url}
          placeholder="https://example.com/image.png"
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      <label className="lexical-modal-field">
        <span>Alt Text</span>
        <input
          type="text"
          value={altText}
          placeholder="Descriptive alternative text"
          onChange={(e) => setAltText(e.target.value)}
        />
      </label>
      <div className="lexical-modal-actions">
        <button
          type="button"
          className="lexical-modal-confirm"
          disabled={!url.trim()}
          onClick={() => {
            onInsert({ src: url.trim(), altText });
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );

  const renderFile = () => (
    <div className="lexical-modal-content lexical-modal-grid">
      <label className="lexical-modal-field">
        <span>Image Upload</span>
        <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files)} />
      </label>
      <label className="lexical-modal-field">
        <span>Alt Text</span>
        <input
          type="text"
          value={altText}
          placeholder="Descriptive alternative text"
          onChange={(e) => setAltText(e.target.value)}
        />
      </label>
      <div className="lexical-modal-actions">
        <button
          type="button"
          className="lexical-modal-confirm"
          disabled={!fileData}
          onClick={() => {
            if (!fileData) return;
            onInsert({ src: fileData.src, altText: altText || fileData.name });
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );

  return (
    <div className="lexical-modal-backdrop" onClick={onClose}>
      <div className="lexical-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lexical-modal-header">
          <span>Insert Image</span>
          <button className="lexical-modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        {mode === 'choose' && renderChooser()}
        {mode === 'url' && renderUrl()}
        {mode === 'file' && renderFile()}
      </div>
    </div>
  );
}

function InsertTableDialog({
  rows,
  cols,
  onChangeRows,
  onChangeCols,
  onConfirm,
  onClose,
}: {
  rows: string;
  cols: string;
  onChangeRows: (value: string) => void;
  onChangeCols: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const rowsNum = Number(rows);
  const colsNum = Number(cols);
  const disabled = !rowsNum || !colsNum || rowsNum <= 0 || colsNum <= 0;
  return (
    <div className="lexical-modal-backdrop" onClick={onClose}>
      <div className="lexical-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lexical-modal-header">
          <span>Insert Table</span>
          <button className="lexical-modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="lexical-modal-content lexical-modal-grid">
          <label className="lexical-modal-field">
            <span>Rows</span>
            <input
              type="number"
              min="1"
              max="500"
              value={rows}
              onChange={(e) => onChangeRows(e.target.value)}
            />
          </label>
          <label className="lexical-modal-field">
            <span>Columns</span>
            <input
              type="number"
              min="1"
              max="50"
              value={cols}
              onChange={(e) => onChangeCols(e.target.value)}
            />
          </label>
          <div className="lexical-modal-actions">
            <button type="button" disabled={disabled} onClick={onConfirm} className="lexical-modal-confirm">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
