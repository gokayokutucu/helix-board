import type {
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $getNodeByKey, DecoratorNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useCallback, useRef } from 'react';

export type SerializedImageNode = Spread<
  {
    altText: string;
    height?: number | 'inherit';
    src: string;
    width?: number | 'inherit';
  },
  SerializedLexicalNode
>;

function convertImageElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    const { alt, src, width, height } = domNode;
    return {
      node: $createImageNode({
        altText: alt,
        src,
        width: width || 'inherit',
        height: height || 'inherit',
      }),
    };
  }
  return null;
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | 'inherit';
  __height: number | 'inherit';

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__width, node.__height, node.__key);
  }

  constructor(
    src: string,
    altText: string,
    width: number | 'inherit' = 'inherit',
    height: number | 'inherit' = 'inherit',
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, src, width } = serializedNode;
    return $createImageNode({ altText, height, src, width });
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.__altText,
      height: this.__height,
      src: this.__src,
      type: 'image',
      version: 1,
      width: this.__width,
    };
  }

  setWidth(width: number | 'inherit') {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setHeight(height: number | 'inherit') {
    const writable = this.getWritable();
    writable.__height = height;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const className = config.theme.image;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.getKey()}
      />
    );
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }
}

export function $createImageNode({
  src,
  altText,
  width,
  height,
}: {
  src: string;
  altText?: string;
  width?: number | 'inherit';
  height?: number | 'inherit';
}): ImageNode {
  return new ImageNode(src, altText ?? '', width ?? 'inherit', height ?? 'inherit');
}

export function $isImageNode(node: unknown): node is ImageNode {
  return node instanceof ImageNode;
}

function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: {
  src: string;
  altText: string;
  width: number | 'inherit';
  height: number | 'inherit';
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected] = useLexicalNodeSelection(nodeKey);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef<number>(typeof width === 'number' ? width : 200);

  const finishResize = useCallback(() => {
    resizingRef.current = false;
  }, []);

  const handleResizeDrag = useCallback(
    (event: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = event.clientX - startXRef.current;
      const newWidth = Math.max(60, startWidthRef.current + delta);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.setWidth(newWidth);
        }
      });
    },
    [editor, nodeKey]
  );

  const handleResizeStart = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      resizingRef.current = true;
      startXRef.current = event.clientX;
      startWidthRef.current = typeof width === 'number' ? width : 200;
      const move = (e: MouseEvent) => handleResizeDrag(e);
      const up = () => {
        finishResize();
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    },
    [finishResize, handleResizeDrag, width]
  );

  const style: React.CSSProperties = {
    maxWidth: '100%',
    width: typeof width === 'number' ? `${width}px` : 'auto',
    height: height === 'inherit' ? 'auto' : `${height}px`,
    border: isSelected ? '2px solid #94a3b8' : 'none',
    borderRadius: 10,
    cursor: 'pointer',
  };

  return (
    <span data-image-key={nodeKey} className="editor-image">
      <div className="image-wrapper">
        <img src={src} alt={altText} style={style} draggable={false} />
        <div className="image-resizer" onMouseDown={handleResizeStart} />
      </div>
    </span>
  );
}
