import { useState } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { formatDistanceToNow } from 'date-fns';
import { CommentEditor } from './editor/CommentEditor';

export type Comment = {
  id: string;
  authorName: string;
  authorInitials: string;
  createdAt: string;
  contentHtml: string;
};

type CommentsSectionProps = {
  comments: Comment[];
  onAdd: (contentHtml: string) => void;
};

export function CommentsSection({ comments, onAdd }: CommentsSectionProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    const temp = document.createElement('div');
    temp.innerHTML = inputValue;
    if (!temp.textContent?.trim()) return;
    onAdd(inputValue);
    setInputValue('');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Comments</h3>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-200 text-gray-800 text-xs font-semibold">
                {comment.authorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 border border-gray-100 rounded-lg px-3 py-2 bg-white shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span className="font-semibold text-gray-800">{comment.authorName}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="text-sm text-gray-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comment.contentHtml }} />
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg bg-gray-50 px-3 py-3">
        <CommentEditor value={inputValue} onChange={setInputValue} />
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={handleSubmit}>
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
