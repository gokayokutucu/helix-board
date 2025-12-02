import Image from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/core';

function ImageComponent(props: NodeViewProps) {
  const { node, selected } = props;
  const { src, alt, title } = node.attrs;

  return (
    <NodeViewWrapper
      as="figure"
      className={`tiptap-image-node ${selected ? 'selected' : ''}`}
      data-drag-handle
    >
      <img src={src} alt={alt} title={title} />
      {alt && <figcaption className="text-xs text-slate-500 mt-1">{alt}</figcaption>}
    </NodeViewWrapper>
  );
}

export const ImageNode = Image.extend({
  name: 'customImage',
  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});
